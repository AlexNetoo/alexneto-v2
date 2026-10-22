'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AccentContext, ThemeProvider, usePal, useThemeContext } from '@/halaska-kit';
import '../kit-theme';

type Scheme = 'light' | 'dark';

const readScheme = (): Scheme => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

/** Follows the site's `html[data-theme]`, so the admin matches the public theme toggle. */
function useScheme(): [Scheme, boolean] {
  const [scheme, setScheme] = useState<Scheme>('dark');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setScheme(readScheme());
    setReady(true);
    const obs = new MutationObserver(() => setScheme(readScheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return [scheme, ready];
}

/** Halaska UI root for the admin: brand accent, Suisse Int'l (font vars live in admin.css). */
export function AdminProviders({ children }: { children: ReactNode }) {
  const [scheme, ready] = useScheme();
  return (
    <ThemeProvider theme={scheme}>
      <AccentContext.Provider value={scheme === 'dark' ? '#6ea2ff' : '#1f5fe0'}>
        <Page ready={ready}>{children}</Page>
      </AccentContext.Provider>
    </ThemeProvider>
  );
}

/** The kit palette is inline-only; expose it as CSS variables for the few plain-CSS parts (admin.css). */
function useVars(): CSSProperties {
  const pal = usePal(useThemeContext());
  return {
    '--hk-bg': pal.bg,
    '--hk-bg-elevated': pal.bgElevated,
    '--hk-bg-subtle': pal.bgSubtle,
    '--hk-bg-muted': pal.bgMuted,
    '--hk-bg-hover': pal.bgHover,
    '--hk-border': pal.border,
    '--hk-border-subtle': pal.borderSubtle,
    '--hk-border-focus': pal.borderFocus,
    '--hk-text': pal.text,
    '--hk-text-secondary': pal.textSecondary,
    '--hk-text-tertiary': pal.textTertiary,
  } as CSSProperties;
}

function Page({ children, ready }: { children: ReactNode; ready: boolean }) {
  const pal = usePal(useThemeContext());
  const vars = useVars();
  return (
    // Hidden until the stored theme has been read, so light-mode visitors never see a dark flash.
    <div className="hk-root" style={{ ...vars, minHeight: '100vh', background: pal.bg, color: pal.text, opacity: ready ? 1 : 0 }}>
      {children}
    </div>
  );
}

/**
 * Renders overlays on document.body. The site's page wrapper keeps a CSS transform, which would
 * otherwise trap `position: fixed` modals inside it. Theme/accent context passes through portals.
 * Only mount this after hydration (i.e. behind user-driven state), never in the initial render.
 */
export function AdminPortal({ children }: { children: ReactNode }) {
  const vars = useVars();
  return createPortal(
    <div className="hk-portal" style={vars}>
      {children}
    </div>,
    document.body,
  );
}

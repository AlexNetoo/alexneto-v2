'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/**
 * Theme state for the dark mode pill in the nav. The theme is stored in localStorage and applied before first paint
 * (inline script in layout.tsx); with nothing stored it follows the system setting. The icons swap in CSS
 * from html[data-theme], so there is no flash of the wrong icon.
 */
export function useThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const html = document.documentElement;
    html.classList.add('theme-anim');
    html.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0c0c0c' : '#f5f5f5');
    setTheme(next);
    window.setTimeout(() => html.classList.remove('theme-anim'), 600);
  };

  return { theme, toggle };
}

export function ThemeIcons() {
  return (
    <span className="theme-icons" aria-hidden="true">
      <svg className="theme-btn__sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
      </svg>
      <svg className="theme-btn__moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.6A8.6 8.6 0 0 1 9.4 4 8.6 8.6 0 1 0 20 14.6z" />
      </svg>
    </span>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { whatsappUrl } from '@/data/site';

const ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
] as const;

/**
 * Progressive-disclosure nav, top right. Closed it is one small black button; open, the same black shape grows
 * (a clip-path morph) into a dark panel with the page links. Esc, a click outside or a page change closes it.
 */
export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const current = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <header className="nav">
      <a className="skip" href="#main">
        skip to content
      </a>
      <div ref={root} className={`menu${open ? ' is-open' : ''}`}>
        <button
          ref={button}
          type="button"
          className="menu__button"
          aria-expanded={open}
          aria-controls="menu-panel"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="menu__icon" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>
        <nav id="menu-panel" className="menu__panel" aria-label="Primary" inert={!open}>
          <ul className="menu__links">
            {ITEMS.map((i, n) => (
              <li key={i.href}>
                <Link href={i.href} style={{ ['--i' as string]: n }} aria-current={current(i.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
          <a className="menu__contact" style={{ ['--i' as string]: ITEMS.length }} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            contact <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { THEME_KEY, isLight } from '@/lib/theme';

/** A small dot after "contact" that flips the site between dark and light. The choice is remembered. */
export function ThemeDot() {
  const [light, setLight] = useState(false);

  useEffect(() => setLight(isLight()), []);

  const toggle = () => {
    const next = !isLight();
    const root = document.documentElement;
    if (next) root.setAttribute('data-site-theme', 'light');
    else root.removeAttribute('data-site-theme');
    try {
      localStorage.setItem(THEME_KEY, next ? 'light' : 'dark');
    } catch {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#f3f0ea' : '#1a1917');
    setLight(next);
  };

  return <button type="button" className="theme-dot" onClick={toggle} aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'} title={light ? 'Dark mode' : 'Light mode'} />;
}

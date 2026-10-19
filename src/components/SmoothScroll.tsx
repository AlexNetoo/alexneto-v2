'use client';

import Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}
import { useEffect } from 'react';

/** Lenis smooth scroll (off for reduced motion). The scroll-linked wordmark reads the real scroll position. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    window.__lenis = lenis; // so buttons (back to top) scroll through Lenis instead of fighting it
    let raf = 0;
    const tick = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.__lenis = undefined;
      lenis.destroy();
    };
  }, []);
  return null;
}

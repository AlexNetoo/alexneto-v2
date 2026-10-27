'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/**
 * Scroll motion for a block. It rises and fades in the first time it enters the screen, and with
 * `drift` it also keeps moving while you scroll: it slides a little against the scroll and eases
 * from slightly smaller (at the edges of the screen) to full size (in the middle).
 * Does nothing for reduced motion.
 */
export function Reveal({ children, className = '', delay = 0, drift = false }: { children: ReactNode; className?: string; delay?: number; drift?: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outer.current;
    const mover = inner.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in');
      return;
    }
    let visible = false;
    let raf = 0;

    const update = () => {
      raf = 0;
      if (!drift || !mover || !visible) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1 when the block is one screen above the middle, 0 in the middle, 1 one screen below
      const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      mover.style.setProperty('--ty', (t * -34).toFixed(1));
      mover.style.setProperty('--s', (1 - Math.abs(t) * 0.045).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (e.isIntersecting) {
          el.classList.add('is-in');
          update();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    if (drift) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    }
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [drift]);

  return (
    <div ref={outer} className={`reveal ${className}`} style={{ ['--d' as string]: `${delay}s` } as CSSProperties}>
      <div ref={inner} className={drift ? 'reveal__inner' : undefined}>
        {children}
      </div>
    </div>
  );
}

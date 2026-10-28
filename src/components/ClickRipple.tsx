'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { INK } from '@/lib/vinyl';

/** The pages that get the click ripple (the landing has its own, which also shoves the records). */
const PAGES = ['/projects', '/about'];

/**
 * The landing's click effect for the other pages: click anywhere and a ring of small square cells spreads out
 * from the pointer and fades, the same cells, speed and lifetime as the ripple on the landing. Clicks on links
 * and buttons are left alone. Nothing runs until you click, and nothing at all with reduced motion.
 */
export function ClickRipple() {
  const path = usePathname();
  const canvas = useRef<HTMLCanvasElement>(null);
  const on = PAGES.includes(path);

  useEffect(() => {
    const cv = canvas.current;
    if (!on || !cv) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const LIFE = 1.6; // seconds
    const SPEED = 34 * 11; // px/s, as on the landing
    type Ripple = { x: number; y: number; r: number; age: number };
    let ripples: Ripple[] = [];
    let W = 0;
    let H = 0;
    let dpr = 1;
    let CELL = 6;
    let raf = 0;
    let last = 0;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      CELL = W < 700 ? 5 : 6;
      cv.width = W * dpr;
      cv.height = H * dpr;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      for (const rp of ripples) {
        rp.age += dt;
        rp.r += dt * SPEED;
      }
      ripples = ripples.filter((rp) => rp.age < LIFE);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgb(${INK[1]})`;
      const size = CELL - 0.9;
      const band = 11; // ring thickness in px
      for (const rp of ripples) {
        const fade = Math.max(0, 1 - rp.age / LIFE);
        const reach = Math.ceil((rp.r + band) / CELL);
        const cx0 = Math.floor(rp.x / CELL);
        const cy0 = Math.floor(rp.y / CELL);
        for (let j = cy0 - reach; j <= cy0 + reach; j++) {
          const py = j * CELL + CELL / 2;
          if (py < -CELL || py > H + CELL) continue;
          for (let i = cx0 - reach; i <= cx0 + reach; i++) {
            const px = i * CELL + CELL / 2;
            if (px < -CELL || px > W + CELL) continue;
            const off = Math.abs(Math.hypot(px - rp.x, py - rp.y) - rp.r);
            if (off > band / 2) continue;
            const cov = 1 - off / (band / 2); // 1 in the middle of the ring, 0 at its edges
            const s = size * (0.45 + 0.55 * cov);
            ctx.globalAlpha = Math.min(1, 0.9 * fade * (0.35 + 0.65 * cov));
            ctx.fillRect(i * CELL + (CELL - s) / 2, j * CELL + (CELL - s) / 2, s, s);
          }
        }
      }
      ctx.globalAlpha = 1;
      if (ripples.length) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        last = 0;
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as Element | null)?.closest?.('a, button, input, textarea, select, summary, [role="button"]')) return;
      ripples.push({ x: e.clientX, y: e.clientY, r: 11, age: 0 });
      if (!raf) raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', onDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [on]);

  if (!on) return null;
  return <canvas ref={canvas} className="click-ripple" aria-hidden="true" />;
}

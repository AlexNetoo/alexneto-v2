'use client';

import { useEffect, useRef } from 'react';

const GAP = 22; // grid spacing, px
const R = 150; // reach of the cursor, px
const PUSH = 7; // how far the nearest dots lean away, px

/**
 * A quiet grid of dots that only shows around the pointer on the site's white space: the dots fade in near the
 * cursor and lean slightly away from it, trailing it with a little lag. It fades out over text, links, images and
 * the project cards. Mouse and trackpad only, nothing with reduced motion, and the loop sleeps when there's nothing to draw.
 */
export function DotField() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let tx = -1e4;
    let ty = -1e4;
    let x = tx;
    let y = ty;
    let want = 0; // 1 over white space, 0 elsewhere
    let k = 0; // eased visibility
    let raf = 0;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr;
      cv.height = H * dpr;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (k < 0.01) return;
      ctx.fillStyle = 'rgb(153, 153, 153)'; // --color-text-tertiary
      const x0 = Math.floor((x - R) / GAP) * GAP;
      const y0 = Math.floor((y - R) / GAP) * GAP;
      for (let gy = y0; gy <= y + R; gy += GAP) {
        for (let gx = x0; gx <= x + R; gx += GAP) {
          const dx = gx - x;
          const dy = gy - y;
          const d = Math.hypot(dx, dy);
          if (d >= R) continue;
          const f = Math.pow(1 - d / R, 2) * k;
          const push = d > 0 ? (f * PUSH) / d : 0;
          ctx.globalAlpha = Math.min(1, f * 1.1);
          ctx.beginPath();
          ctx.arc(gx + dx * push, gy + dy * push, 0.8 + f * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      k += (want - k) * 0.1;
      draw();
      const settled = Math.abs(tx - x) < 0.3 && Math.abs(ty - y) < 0.3 && Math.abs(want - k) < 0.005;
      raf = settled ? 0 : requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const t = e.target instanceof Element ? e.target : null;
      const busy = !!t?.closest('a, button, p, h1, h2, h3, li, img, video, figure, .pcard, .row, .home__tag, .menu, .sound, .lightbox');
      if (k < 0.01) {
        // first appearance: start where the pointer is, not sliding in from the last spot
        x = e.clientX;
        y = e.clientY;
      }
      tx = e.clientX;
      ty = e.clientY;
      want = busy ? 0 : 1;
      wake();
    };
    const onLeave = () => {
      want = 0;
      wake();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={canvas} className="dot-field" aria-hidden="true" />;
}

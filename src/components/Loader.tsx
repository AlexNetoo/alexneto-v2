'use client';

import { useEffect, useRef, useState } from 'react';

const MIN = 1900; // ms the loader stays up at least
const MAX = 3200;

/**
 * The landing loader: a vinyl record drawn in the same small square cells as the records on the landing.
 * It spins up from standstill while its grooves are "cut" from the rim inwards, with a percentage underneath.
 * When it is done it fades away and tells the page (`site:ready`) so the records drop in and the text types out.
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const cv = canvas.current;
    const sect = root.current?.parentElement;
    if (!cv || !sect) return;
    const finish = () => {
      sect.classList.remove('is-loading');
      window.dispatchEvent(new Event('site:ready'));
      setDone(true);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      setGone(true);
      return;
    }
    const ctx = cv.getContext('2d');
    const ras = document.createElement('canvas');
    const rctx = ras.getContext('2d', { willReadFrequently: true });
    if (!ctx || !rctx) return;

    const N = 36; // cells across
    const S = 2; // raster pixels per cell
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const CELL = window.innerWidth < 700 ? 7 : 9;
    cv.width = N * CELL * dpr;
    cv.height = N * CELL * dpr;
    cv.style.width = `${N * CELL}px`;
    cv.style.height = `${N * CELL}px`;
    ras.width = N * S;
    ras.height = N * S;
    const tones = ['70,68,64', '92,90,85', '118,115,109', '146,142,135', '174,169,161', '200,195,187', '224,218,209', '244,238,229'];

    let raf = 0;
    let t0 = 0;
    let ang = 0;
    let last = 0;
    let ended = false;
    let fontsReady = false;
    void document.fonts.ready.then(() => (fontsReady = true));

    const draw = (p: number, dt: number) => {
      ang += (1.2 + p * p * 14) * dt; // spins up
      const c = rctx;
      c.clearRect(0, 0, ras.width, ras.height);
      const cx = (N / 2) * S;
      const cy = (N / 2) * S;
      const R = 15 * S;
      const label = R * 0.36;
      const circle = (rad: number) => {
        c.beginPath();
        c.arc(cx, cy, Math.max(0, rad), 0, Math.PI * 2);
      };
      const grow = Math.min(1, p * 4); // the disc appears over the first quarter
      c.fillStyle = 'rgb(74,72,68)';
      circle(R * (0.2 + 0.8 * grow));
      c.fill();
      // grooves are cut from the rim inwards as it loads
      const cut = R - (R - label - S) * p;
      for (let rad = R - S * 1.6, n = 0; rad > label + S * 1.2; rad -= S, n++) {
        if (rad < cut) break;
        c.strokeStyle = n % 2 ? 'rgb(122,118,112)' : 'rgb(58,56,52)';
        c.lineWidth = S * 0.55;
        circle(rad);
        c.stroke();
      }
      c.strokeStyle = 'rgb(214,208,200)';
      c.lineWidth = S * 0.9;
      circle(R * (0.2 + 0.8 * grow) - S * 0.45);
      c.stroke();
      c.fillStyle = 'rgba(255,248,240,0.6)';
      for (let q = 0; q < 2; q++) {
        const s0 = ang + q * Math.PI;
        c.beginPath();
        c.moveTo(cx + Math.cos(s0) * label * 1.25, cy + Math.sin(s0) * label * 1.25);
        c.arc(cx, cy, Math.max(0, R * grow - S * 1.1), s0 - 0.2, s0 + 0.2);
        c.lineTo(cx + Math.cos(s0 - 0.2) * label * 1.25, cy + Math.sin(s0 - 0.2) * label * 1.25);
        c.closePath();
        c.fill();
      }
      c.fillStyle = 'rgb(96,140,255)';
      circle(label * grow);
      c.fill();
      c.fillStyle = 'rgb(26,24,22)';
      c.beginPath();
      c.arc(cx + Math.cos(ang) * label * 0.62, cy + Math.sin(ang) * label * 0.62, S * 0.55, 0, Math.PI * 2);
      c.fill();
      c.globalCompositeOperation = 'destination-out';
      c.beginPath();
      c.arc(cx, cy, S * 0.7, 0, Math.PI * 2);
      c.fill();
      c.globalCompositeOperation = 'source-over';

      const data = c.getImageData(0, 0, ras.width, ras.height).data;
      const stride = ras.width * 4;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, N * CELL, N * CELL);
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          let al = 0;
          let r = 0;
          let g = 0;
          let b = 0;
          const o = y * 2 * stride + x * 2 * 4;
          for (const q of [o, o + 4, o + stride, o + stride + 4]) {
            const pa = data[q + 3] / 255;
            al += pa;
            r += data[q] * pa;
            g += data[q + 1] * pa;
            b += data[q + 2] * pa;
          }
          const cov = al / 4;
          if (cov < 0.05) continue;
          const rr = r / al;
          const gg = g / al;
          const bb = b / al;
          const lum = (rr + gg + bb) / 3;
          let fill = `rgb(${tones[Math.min(7, Math.max(0, Math.floor(lum / 31)))]})`;
          if (bb - rr > 38) fill = 'rgb(107,149,255)';
          const size = CELL - 1.3;
          const s = cov > 0.45 ? size : size * (0.4 + (cov / 0.45) * 0.6);
          ctx.globalAlpha = Math.min(1, cov > 0.45 ? 0.6 + cov * 0.4 : cov * 1.4);
          ctx.fillStyle = fill;
          ctx.fillRect(x * CELL + (CELL - s) / 2, y * CELL + (CELL - s) / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      if (!t0) t0 = last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const el = now - t0;
      // eases out, and never reaches 100 until the fonts are in and the minimum time has passed
      const lin = Math.min(1, el / MIN);
      const p = 1 - Math.pow(1 - lin, 2.2);
      const ready = el >= MIN && (fontsReady || el >= MAX);
      const shown = ready ? 1 : Math.min(p, 0.99);
      draw(shown, dt);
      if (pct.current) pct.current.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      if (ready && !ended) {
        ended = true;
        window.setTimeout(finish, 260);
        window.setTimeout(() => setGone(true), 1100);
      }
      raf = requestAnimationFrame(frame);
      if (ended && el > MIN + 1200) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className={`pond__loader${done ? ' is-done' : ''}`} aria-hidden="true">
      <canvas ref={canvas} />
      <p>
        <span>loading</span>
        <span ref={pct}>000</span>
      </p>
    </div>
  );
}

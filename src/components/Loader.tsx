'use client';

import { useEffect, useRef, useState } from 'react';
import { INK, drawVinyl, toneOf } from '@/lib/vinyl';

const TOTAL = 1250; // ms from first frame to "done"
const MAX = 2400; // never wait longer than this for fonts

/**
 * The landing intro, played once per visit: a vinyl record drawn in the same small square cells as the records
 * on the landing. The cells assemble out of nothing (a pixel dissolve from the middle outwards) while the record
 * spins up, a tonearm swings across and drops its needle with a ripple, the label flips to "now playing", and the
 * camera falls into the record, which hands over to the landing. Then the records drop in and the text types out.
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const word = useRef<HTMLSpanElement>(null);
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
    };
    let seen = false;
    try {
      seen = !!sessionStorage.getItem('v2-intro');
      sessionStorage.setItem('v2-intro', '1');
    } catch {}
    if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
    const hash = (x: number, y: number) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const easeOut = (a: number) => 1 - Math.pow(1 - a, 3);
    const back = (a: number) => 1 + 2.2 * Math.pow(a - 1, 3) + 1.2 * Math.pow(a - 1, 2); // overshoots, then settles

    // the tonearm: pivots top right, swings from outside the record to a groove near the label
    const C = N / 2;
    const R = 15;
    const piv = { x: 34, y: 2 };
    const tgt = { x: C + 2, y: C - 11.5 };
    const armLen = Math.hypot(tgt.x - piv.x, tgt.y - piv.y);
    const armEnd = Math.atan2(tgt.y - piv.y, tgt.x - piv.x);
    const armStart = (84 * Math.PI) / 180;

    let raf = 0;
    let t0 = 0;
    let last = 0;
    let ang = 0;
    let ended = false;
    let fontsReady = false;
    let playing = false;
    let seg: [number, number, number, number] | null = null; // the tonearm in cells, so it skips the dissolve
    void document.fonts.ready.then(() => (fontsReady = true));

    const draw = (p: number, dt: number) => {
      const asm = clamp01(p / 0.42); // how much of the record has assembled
      ang += (2 + easeOut(clamp01(p / 0.8)) * 16) * dt; // spins up
      const c = rctx;
      c.clearRect(0, 0, ras.width, ras.height);
      const cx = C * S;
      const cy = C * S;
      const RR = R * S;
      const circle = (x: number, y: number, rad: number) => {
        c.beginPath();
        c.arc(x, y, Math.max(0, rad), 0, Math.PI * 2);
      };
      drawVinyl(c, cx, cy, RR, S, ang, 'half');

      // tonearm, swinging in and dropping (overshoots a little, then settles into the groove)
      const a = clamp01((p - 0.28) / 0.46);
      if (p > 0.2) {
        const th = armStart + (armEnd - armStart) * back(a);
        const tx = (piv.x + Math.cos(th) * armLen) * S;
        const ty = (piv.y + Math.sin(th) * armLen) * S;
        seg = [piv.x, piv.y, tx / S, ty / S];
        c.strokeStyle = 'rgb(70,68,64)';
        c.lineWidth = S * 0.9;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(piv.x * S, piv.y * S);
        c.lineTo(tx, ty);
        c.stroke();
        c.fillStyle = 'rgb(70,68,64)';
        circle(piv.x * S, piv.y * S, S * 1.5);
        c.fill();
        c.fillStyle = 'rgb(30,30,30)';
        circle(tx, ty, S * 1.15);
        c.fill();
        // the needle lands: a ripple
        if (a >= 1) {
          const q = clamp01((p - 0.74) / 0.26);
          c.globalAlpha = (1 - q) * 0.8;
          c.strokeStyle = 'rgb(120,120,120)';
          c.lineWidth = S * 0.9;
          circle(tx, ty, S * (1 + q * 9));
          c.stroke();
          c.globalAlpha = 1;
        }
      }

      const data = c.getImageData(0, 0, ras.width, ras.height).data;
      const stride = ras.width * 4;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, N * CELL, N * CELL);
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          // pixel dissolve: cells switch on in a random order that favours the middle
          const dist = Math.hypot(x + 0.5 - C, y + 0.5 - C) / R;
          let arm = false;
          if (seg) {
            const [x1, y1, x2, y2] = seg;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const u = clamp01(((x + 0.5 - x1) * dx + (y + 0.5 - y1) * dy) / (dx * dx + dy * dy));
            arm = Math.hypot(x + 0.5 - (x1 + u * dx), y + 0.5 - (y1 + u * dy)) < 1.6 || Math.hypot(x + 0.5 - x2, y + 0.5 - y2) < 3.2;
          }
          if (!arm && hash(x, y) * 0.55 + Math.min(1, dist) * 0.45 > asm) continue;
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
          const fill = `rgb(${INK[toneOf(r / al, g / al, b / al)]})`;
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
      const lin = clamp01(el / TOTAL);
      const ready = el >= TOTAL && (fontsReady || el >= MAX);
      const p = ready ? 1 : Math.min(lin, 0.97);
      draw(p, dt);
      if (pct.current) pct.current.textContent = String(Math.round(p * 100)).padStart(3, '0');
      if (!playing && p >= 0.74 && word.current) {
        playing = true;
        word.current.textContent = 'now playing';
      }
      if (ready && !ended) {
        ended = true;
        window.setTimeout(() => {
          finish();
          setDone(true);
        }, 160);
        window.setTimeout(() => setGone(true), 900);
      }
      if (!ended || el < TOTAL + 1000) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className={`pond__loader${done ? ' is-done' : ''}`} aria-hidden="true">
      <canvas ref={canvas} />
      <p>
        <span ref={word}>loading</span>
        <span ref={pct}>000</span>
      </p>
    </div>
  );
}

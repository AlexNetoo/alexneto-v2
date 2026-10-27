'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

type Item = { slug: string; title: string };

/**
 * The landing animation: vinyl records drifting on a dark floor, drawn in small square cells.
 * Each record is one of the projects.
 *
 * How it works: the records are simulated and drawn as smooth vector shapes (disc, grooves, a spinning
 * sheen, a coloured label) into a tiny offscreen canvas at 2 pixels per cell. That is read back and
 * re-drawn as a grid of squares whose size and opacity follow the coverage and whose tone follows the
 * brightness, so grooves turn into rings of lighter and darker cells. Cells fade out slowly, which leaves
 * a soft trail behind anything that moves. Hover a record to see which project it is (it spins up and
 * slows down), click it to open the project, click the floor to send out a ripple that knocks records
 * away, and watch them bump into each other.
 */
export function Records({ items }: { items: Item[] }) {
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const box = wrap.current;
    const tag = label.current;
    if (!cv || !box || !tag) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sect = box.parentElement;

    // offscreen raster: 2 pixels per cell
    const ras = document.createElement('canvas');
    const rctx = ras.getContext('2d', { willReadFrequently: true });
    if (!rctx) return;

    const hash = (n: number) => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    type Rec = {
      item: Item;
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number; // radius in cells
      ang: number; // spin angle
      spin: number; // current spin speed (rad/s)
      baseSpin: number;
      label: 'blue' | 'amber' | 'cream';
      seed: number;
      born: number; // when it drops in (seconds after load)
      app: number; // 0..1, how far it has dropped in
    };
    type Ripple = { x: number; y: number; r: number; age: number };

    let CELL = 11;
    let cols = 0;
    let rows = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let recs: Rec[] = [];
    let ripples: Ripple[] = [];
    let trailV = new Float32Array(0); // coverage, fades out
    let trailT = new Uint8Array(0); // tone: 0..7 neutral levels, 8 blue, 9 amber
    let jitter = new Float32Array(0);
    const ptr = { x: -999, y: -999, on: false };
    const par = { x: 0, y: 0 }; // eased parallax, -1..1
    let shove = 0; // scroll / drag energy that also tilts the whole field, decays
    let drag: { x: number; y: number } | null = null;
    let hovered = -1;
    let raf = 0;
    let last = 0;
    let time = 0;

    const LABELS: Rec['label'][] = ['blue', 'amber', 'cream', 'blue', 'cream', 'amber', 'blue'];

    const makeRecords = () => {
      // records are sized in cells, so on a narrow grid (phones) they are scaled down to stay in proportion
      const sc = Math.max(0.5, Math.min(1, cols / 110));
      recs = items.map((item, i) => {
        const seed = i + 1;
        const ang = hash(seed * 9.3) * Math.PI * 2;
        const sp = (2.2 + hash(seed * 2.2) * 2.4) * Math.max(0.6, sc);
        const r = (6.2 + (i % 3) * 1.1 + hash(seed * 4.4) * 1.1) * sc;
        return {
          item,
          x: cols * (0.14 + hash(seed * 3.1) * 0.72),
          y: rows * (0.16 + hash(seed * 5.7) * 0.62),
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r,
          ang: hash(seed * 1.7) * 6.28,
          spin: 0,
          baseSpin: (1.1 + hash(seed * 6.1) * 0.8) * (i % 2 ? 1 : -1),
          label: LABELS[i % LABELS.length],
          seed,
          born: reduce ? -10 : 0.25 + i * 0.14,
          app: reduce ? 1 : 0,
        };
      });
      recs.forEach((r) => (r.spin = r.baseSpin));
    };

    const resize = () => {
      const b = box.getBoundingClientRect();
      W = Math.max(1, Math.floor(b.width));
      H = Math.max(1, Math.floor(b.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      CELL = W < 700 ? 8 : 11;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cols = Math.ceil(W / CELL);
      rows = Math.ceil(H / CELL);
      ras.width = cols * 2;
      ras.height = rows * 2;
      trailV = new Float32Array(cols * rows);
      trailT = new Uint8Array(cols * rows);
      jitter = new Float32Array(cols * rows);
      for (let i = 0; i < jitter.length; i++) jitter[i] = 0.84 + hash(i) * 0.16;
      makeRecords();
    };

    const step = (dt: number) => {
      time += dt;
      for (const rp of ripples) {
        rp.age += dt;
        rp.r += dt * 34;
      }
      ripples = ripples.filter((rp) => rp.age < 1.6);

      recs.forEach((a, idx) => {
        a.app = Math.min(1, Math.max(0, (time - a.born) / 1.2));
        // records are repelled a little by the cursor, like objects in water
        if (ptr.on && hovered !== idx && a.app > 0.6) {
          const dx = a.x - ptr.x / CELL;
          const dy = a.y - ptr.y / CELL;
          const d = Math.hypot(dx, dy);
          const reach = a.r + 7;
          if (d > 0.01 && d < reach) {
            const f = (1 - d / reach) * 22 * dt;
            a.vx += (dx / d) * f;
            a.vy += (dy / d) * f;
            a.spin += f * 0.5 * (idx % 2 ? 1 : -1);
          }
        }
        // ripples shove records outward
        for (const rp of ripples) {
          const dx = a.x - rp.x;
          const dy = a.y - rp.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.01 && Math.abs(d - rp.r) < 4) {
            const push = 26 * dt * (1 - rp.age / 1.6);
            a.vx += (dx / d) * push;
            a.vy += (dy / d) * push;
            a.spin += push * 0.6 * (idx % 2 ? 1 : -1);
          }
        }
        // bump into each other (equal masses, soft)
        for (let j = idx + 1; j < recs.length; j++) {
          const b = recs[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = a.r + b.r;
          if (d < min && d > 0.01) {
            const nx = dx / d;
            const ny = dy / d;
            const over = (min - d) / 2;
            a.x -= nx * over;
            a.y -= ny * over;
            b.x += nx * over;
            b.y += ny * over;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) {
              a.vx += nx * rv;
              a.vy += ny * rv;
              b.vx -= nx * rv;
              b.vy -= ny * rv;
              a.spin += rv * 0.15;
              b.spin -= rv * 0.15;
            }
          }
        }
        // drift: ease toward a gentle cruising speed, slower when hovered
        const sp = Math.hypot(a.vx, a.vy) || 0.001;
        const cruise = hovered === idx ? 0 : 2.2 + hash(a.seed * 2.2) * 2.2;
        const k = Math.min(1, dt * (hovered === idx ? 5 : 0.7));
        const want = sp + (cruise - sp) * k;
        const capped = Math.min(want, 26);
        a.vx = (a.vx / sp) * capped;
        a.vy = (a.vy / sp) * capped;
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        // walls: bounce
        const m = a.r + 1;
        if (a.x < m) {
          a.x = m;
          a.vx = Math.abs(a.vx);
        } else if (a.x > cols - m) {
          a.x = cols - m;
          a.vx = -Math.abs(a.vx);
        }
        if (a.y < m + 4) {
          a.y = m + 4;
          a.vy = Math.abs(a.vy);
        } else if (a.y > rows - m) {
          a.y = rows - m;
          a.vy = -Math.abs(a.vy);
        }
        // spin: relax to the record's own speed, spin up when hovered
        const e = 1 - Math.pow(1 - a.app, 3);
        const wantSpin = (hovered === idx ? a.baseSpin * 2.6 : a.baseSpin) * (1 + (1 - e) * 5);
        a.spin += (wantSpin - a.spin) * Math.min(1, dt * 1.6);
        a.ang += a.spin * dt;
      });
    };

    const drawRecord = (c: CanvasRenderingContext2D, a: Rec) => {
      const S = 2; // raster pixels per cell
      // drops in: grows from nothing while settling down into place
      const e = 1 - Math.pow(1 - a.app, 3);
      if (e < 0.02) return;
      const cx = a.x * S;
      const cy = (a.y - (1 - e) * 5) * S;
      const R = a.r * S * e;
      const circle = (rad: number) => {
        c.beginPath();
        c.arc(cx, cy, Math.max(0, rad), 0, Math.PI * 2);
      };
      // disc
      c.fillStyle = 'rgb(74,72,68)';
      circle(R);
      c.fill();
      // grooves: alternating lighter rings between the label and the rim
      const label = R * 0.36;
      for (let rad = label + S * 1.2, n = 0; rad < R - S * 1.6; rad += S * 1.0, n++) {
        c.strokeStyle = n % 2 ? 'rgb(122,118,112)' : 'rgb(58,56,52)';
        c.lineWidth = S * 0.55;
        circle(rad);
        c.stroke();
      }
      // bright rim
      c.strokeStyle = 'rgb(214,208,200)';
      c.lineWidth = S * 0.9;
      circle(R - S * 0.45);
      c.stroke();
      // two opposite sheens that sweep round as the record spins
      c.fillStyle = 'rgba(255,248,240,0.62)';
      for (let q = 0; q < 2; q++) {
        const s0 = a.ang + q * Math.PI;
        c.beginPath();
        c.moveTo(cx + Math.cos(s0) * label * 1.25, cy + Math.sin(s0) * label * 1.25);
        c.arc(cx, cy, Math.max(0, R - S * 1.1), s0 - 0.2, s0 + 0.2);
        c.lineTo(cx + Math.cos(s0 - 0.2) * label * 1.25, cy + Math.sin(s0 - 0.2) * label * 1.25);
        c.closePath();
        c.fill();
      }
      // label
      c.fillStyle = a.label === 'blue' ? 'rgb(96,140,255)' : a.label === 'amber' ? 'rgb(240,170,92)' : 'rgb(232,224,212)';
      circle(label);
      c.fill();
      // a notch on the label, so the spin reads even where the grooves are symmetric
      c.fillStyle = 'rgb(26,24,22)';
      c.beginPath();
      c.arc(cx + Math.cos(a.ang) * label * 0.62, cy + Math.sin(a.ang) * label * 0.62, S * 0.55, 0, Math.PI * 2);
      c.fill();
      // spindle hole: cut right through
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = '#000';
      c.beginPath();
      c.arc(cx, cy, S * 0.7, 0, Math.PI * 2);
      c.fill();
      c.globalCompositeOperation = 'source-over';
    };

    const render = (dt: number) => {
      // 1. records and ripples into the raster
      rctx.clearRect(0, 0, ras.width, ras.height);
      for (const rp of ripples) {
        rctx.globalAlpha = Math.max(0, 0.4 * (1 - rp.age / 1.6));
        rctx.strokeStyle = 'rgb(230,224,216)';
        rctx.lineWidth = 1.1 * 2;
        rctx.beginPath();
        rctx.arc(rp.x * 2, rp.y * 2, rp.r * 2, 0, Math.PI * 2);
        rctx.stroke();
      }
      rctx.globalAlpha = 1;
      recs.forEach((a) => drawRecord(rctx, a));
      const data = rctx.getImageData(0, 0, ras.width, ras.height).data;

      // 2. raster -> per-cell coverage and tone, with slow fade (trails)
      const decay = Math.exp(-dt * 5);
      const stride = ras.width * 4;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          let al = 0;
          let r = 0;
          let g = 0;
          let b = 0;
          const o = cy * 2 * stride + cx * 2 * 4;
          for (const q of [o, o + 4, o + stride, o + stride + 4]) {
            const pa = data[q + 3] / 255;
            al += pa;
            r += data[q] * pa;
            g += data[q + 1] * pa;
            b += data[q + 2] * pa;
          }
          const i = cy * cols + cx;
          const cov = al / 4;
          let v = trailV[i] * decay;
          if (cov > 0.04) {
            const rr = r / al;
            const gg = g / al;
            const bb = b / al;
            const lum = (rr + gg + bb) / 3;
            let tone = Math.min(7, Math.max(0, Math.floor(lum / 31)));
            if (bb - rr > 38) tone = 8;
            else if (rr - bb > 70 && rr > 180) tone = 9;
            if (cov >= v) {
              trailV[i] = cov;
              trailT[i] = tone;
              v = cov;
            } else trailV[i] = v;
          } else trailV[i] = v < 0.025 ? 0 : v;
        }
      }

      // 3. cells onto the visible canvas, one pass per tone
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const tones = ['70,68,64', '92,90,85', '118,115,109', '146,142,135', '174,169,161', '200,195,187', '224,218,209', '244,238,229', '107,149,255', '244,176,98'];
      for (let t = 0; t < tones.length; t++) {
        ctx.fillStyle = `rgb(${tones[t]})`;
        for (let i = 0; i < trailV.length; i++) {
          const v = trailV[i];
          if (v < 0.05 || trailT[i] !== t) continue;
          const cx = i % cols;
          const cy = (i / cols) | 0;
          const size = CELL - 1.3;
          const s = v > 0.45 ? size : size * (0.4 + (v / 0.45) * 0.6);
          const off = (CELL - s) / 2;
          ctx.globalAlpha = Math.min(1, v > 0.45 ? 0.6 + v * 0.4 : v * 1.4) * jitter[i];
          ctx.fillRect(cx * CELL + off, cy * CELL + off, s, s);
        }
      }
      ctx.globalAlpha = 1;
    };

    const hit = (px: number, py: number, pad: number) => {
      const x = px / CELL;
      const y = py / CELL;
      let best = -1;
      let bd = Infinity;
      recs.forEach((a, idx) => {
        if (a.app < 0.7) return;
        const d = Math.hypot(a.x - x, a.y - y);
        if (d < a.r + pad && d < bd) {
          bd = d;
          best = idx;
        }
      });
      return best;
    };

    const placeLabel = () => {
      if (hovered < 0) {
        tag.style.opacity = '0';
        return;
      }
      const a = recs[hovered];
      tag.textContent = a.item.title;
      tag.style.transform = `translate(${(a.x + a.r * 0.7) * CELL}px, ${(a.y - a.r - 1.5) * CELL - 14}px)`;
      tag.style.opacity = '1';
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      hovered = ptr.on ? hit(ptr.x, ptr.y, 1) : -1;
      cv.style.cursor = hovered >= 0 ? 'pointer' : 'default';
      step(dt);
      render(dt);
      placeLabel();
      // parallax: the records field and the text slide against each other, following the cursor (or a slow sway
      // on touch screens), and lurch a little when you scroll or drag
      shove *= Math.exp(-dt * 2.2);
      const tx = ptr.on ? (ptr.x / W - 0.5) * 2 : Math.sin(time * 0.23) * 0.55;
      const ty = (ptr.on ? (ptr.y / H - 0.5) * 2 : Math.cos(time * 0.17) * 0.45) + shove;
      const k = 1 - Math.exp(-dt * 2.4);
      par.x += (tx - par.x) * k;
      par.y += (ty - par.y) * k;
      sect?.style.setProperty('--px', par.x.toFixed(3));
      sect?.style.setProperty('--py', par.y.toFixed(3));
    };

    // scrolling (wheel) or dragging (touch) on the landing has nothing to scroll, so it moves the records instead
    const nudge = (dx: number, dy: number, gain: number) => {
      const cdx = Math.max(-140, Math.min(140, dx));
      const cdy = Math.max(-140, Math.min(140, dy));
      recs.forEach((a, i) => {
        const depth = 0.5 + hash(a.seed * 7.7);
        a.vx += cdx * gain * depth;
        a.vy += cdy * gain * depth;
        a.spin += (cdy + cdx) * gain * 1.6 * depth * (i % 2 ? 1 : -1);
      });
      shove = Math.max(-1.2, Math.min(1.2, shove + cdy * gain * 0.35));
    };
    const onWheel = (e: WheelEvent) => nudge(-e.deltaX, -e.deltaY, 0.012);

    const local = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      if (drag) {
        nudge(p.x - drag.x, p.y - drag.y, 0.05);
        drag = { x: p.x, y: p.y };
      }
      ptr.x = p.x;
      ptr.y = p.y;
      ptr.on = e.pointerType !== 'touch';
    };
    const onLeave = () => {
      ptr.on = false;
    };
    const onUp = () => {
      drag = null;
    };
    // when the music is on, every kick nudges the records' spin
    const onKick = () => {
      recs.forEach((a, i) => (a.spin += 0.55 * (i % 2 ? 1 : -1)));
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      const idx = hit(p.x, p.y, e.pointerType === 'touch' ? 2.5 : 1);
      if (idx >= 0) {
        router.push(`/projects/${recs[idx].item.slug}`);
        return;
      }
      ripples.push({ x: p.x / CELL, y: p.y / CELL, r: 1, age: 0 });
      if (e.pointerType === 'touch') drag = { x: p.x, y: p.y };
    };

    const still = () => {
      // no loop for reduced motion: let the records settle a little, then draw one still frame
      for (let i = 0; i < 60; i++) step(1 / 30);
      render(1);
    };

    resize();
    if (reduce) still();
    else raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) still();
    });
    ro.observe(box);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    if (!reduce) window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('site:kick', onKick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerleave', onLeave);
      cv.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('site:kick', onKick);
    };
  }, [items, router]);

  return (
    <div ref={wrap} className="pond__field" style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvas} aria-hidden="true" />
      <span ref={label} className="pond__label" aria-hidden="true" />
    </div>
  );
}

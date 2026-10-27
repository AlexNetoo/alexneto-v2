'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

type Item = { slug: string; title: string };

/**
 * The landing animation: a pond drawn in small square cells. Each fish is one of the projects.
 *
 * How it works: the fish are simulated and drawn as smooth vector shapes into a tiny offscreen canvas
 * (2 pixels per cell), which is then read back and re-drawn as a grid of squares whose size and
 * opacity follow the coverage. Cells fade out slowly, which leaves the dim trails behind each fish.
 * Hover a fish to slow it down and see which project it is, click it to open it, click the water to
 * make a ripple that pushes the fish away.
 */
export function Pond({ items }: { items: Item[] }) {
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

    // offscreen raster: 2 pixels per cell
    const ras = document.createElement('canvas');
    const rctx = ras.getContext('2d', { willReadFrequently: true });
    if (!rctx) return;

    const hash = (n: number) => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    type Fish = {
      item: Item;
      x: number;
      y: number;
      a: number;
      speed: number;
      base: number;
      seed: number;
      n: number; // spine points
      seg: number; // spine segment length in cells
      rad: number; // max body radius in cells
      patches: boolean[];
      phase: number;
      spine: { x: number; y: number }[];
      push: number; // ripple boost, decays
    };
    type Ripple = { x: number; y: number; r: number; age: number };

    let CELL = 11;
    let cols = 0;
    let rows = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let fish: Fish[] = [];
    let ripples: Ripple[] = [];
    let trailV = new Float32Array(0);
    let trailC = new Uint8Array(0); // 0 body, 1 accent, 2 dark
    let jitter = new Float32Array(0);
    const ptr = { x: -999, y: -999, on: false };
    let hovered = -1;
    let raf = 0;
    let last = 0;
    let time = 0;

    const makeFish = () => {
      // fish are sized in cells, so on a narrow grid (phones) they are scaled down to stay in proportion
      const sc = Math.max(0.42, Math.min(1, cols / 110));
      fish = items.map((item, i) => {
        const seed = i + 1;
        const n = 11;
        const len = (15 + (i % 3) * 4 + hash(seed) * 3) * sc;
        const f: Fish = {
          item,
          x: cols * (0.15 + hash(seed * 3.1) * 0.7),
          y: rows * (0.15 + hash(seed * 5.7) * 0.7),
          a: hash(seed * 9.3) * Math.PI * 2,
          speed: 0,
          base: (5.5 + hash(seed * 2.2) * 3.5) * Math.max(0.6, sc),
          seed,
          n,
          seg: len / n,
          rad: (2.7 + hash(seed * 4.4) * 1.3) * sc,
          patches: Array.from({ length: n }, (_, k) => hash(seed * 7.7 + k * 1.9) > 0.66 && k > 1 && k < n - 3),
          phase: hash(seed) * 6.28,
          spine: [],
          push: 0,
        };
        f.speed = f.base;
        f.spine = Array.from({ length: n }, (_, k) => ({ x: f.x - Math.cos(f.a) * f.seg * k, y: f.y - Math.sin(f.a) * f.seg * k }));
        return f;
      });
    };

    const resize = () => {
      const r = box.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width));
      H = Math.max(1, Math.floor(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      CELL = W < 700 ? 8 : 11;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cols = Math.ceil(W / CELL);
      rows = Math.ceil(H / CELL);
      ras.width = cols * 2;
      ras.height = rows * 2;
      trailV = new Float32Array(cols * rows);
      trailC = new Uint8Array(cols * rows);
      jitter = new Float32Array(cols * rows);
      for (let i = 0; i < jitter.length; i++) jitter[i] = 0.82 + hash(i) * 0.18;
      makeFish();
    };

    const angleDiff = (a: number, b: number) => {
      let d = b - a;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    };

    const step = (dt: number) => {
      time += dt;
      for (const r of ripples) {
        r.age += dt;
        r.r += dt * 34;
      }
      ripples = ripples.filter((r) => r.age < 1.6);

      fish.forEach((f, idx) => {
        // wander
        f.a += (Math.sin(time * 0.55 + f.seed * 7) * 0.9 + Math.sin(time * 1.3 + f.seed * 3) * 0.5) * dt;
        // stay in the pond: steer back toward the middle near the edges
        const m = 9;
        if (f.x < m || f.x > cols - m || f.y < m || f.y > rows - m) {
          const to = Math.atan2(rows / 2 - f.y, cols / 2 - f.x);
          f.a += Math.max(-1, Math.min(1, angleDiff(f.a, to))) * 3 * dt;
        }
        // keep a little apart
        for (let j = 0; j < fish.length; j++) {
          if (j === idx) continue;
          const o = fish[j];
          const dx = f.x - o.x;
          const dy = f.y - o.y;
          const d = Math.hypot(dx, dy);
          if (d < 14 && d > 0.01) f.a += Math.max(-1, Math.min(1, angleDiff(f.a, Math.atan2(dy, dx)))) * (1 - d / 14) * 1.6 * dt;
        }
        // ripples push fish away and make them dart
        for (const r of ripples) {
          const dx = f.x - r.x;
          const dy = f.y - r.y;
          const d = Math.hypot(dx, dy);
          if (Math.abs(d - r.r) < 5 && d > 0.01) {
            f.a += Math.max(-1, Math.min(1, angleDiff(f.a, Math.atan2(dy, dx)))) * 6 * dt;
            f.push = Math.min(1.6, f.push + dt * 5);
          }
        }
        f.push = Math.max(0, f.push - dt * 0.9);

        const target = f.base * (hovered === idx ? 0.2 : 1) * (1 + f.push * 1.4);
        f.speed += (target - f.speed) * Math.min(1, 4 * dt);
        f.x += Math.cos(f.a) * f.speed * dt;
        f.y += Math.sin(f.a) * f.speed * dt;
        f.phase += dt * (3 + f.speed * 0.55);

        // spine: each point follows the one before it, with a wave travelling toward the tail
        const sp = f.spine;
        sp[0].x = f.x;
        sp[0].y = f.y;
        for (let k = 1; k < f.n; k++) {
          const dx = sp[k].x - sp[k - 1].x;
          const dy = sp[k].y - sp[k - 1].y;
          const d = Math.hypot(dx, dy) || 1;
          sp[k].x = sp[k - 1].x + (dx / d) * f.seg;
          sp[k].y = sp[k - 1].y + (dy / d) * f.seg;
        }
      });
    };

    const bodyColor = (f: Fish) => {
      const v = 196 + hash(f.seed * 2.9) * 40;
      return `rgb(${v | 0},${(v - 6) | 0},${(v - 14) | 0})`;
    };

    const drawFish = (c: CanvasRenderingContext2D, f: Fish) => {
      const sp = f.spine;
      const S = 2; // raster pixels per cell
      const body = bodyColor(f);
      const wave = (k: number) => Math.sin(f.phase - k * 0.55) * 0.55 * (k / f.n);
      // perpendicular offsets so the body undulates
      const pts = sp.map((p, k) => {
        const prev = sp[Math.max(0, k - 1)];
        const next = sp[Math.min(f.n - 1, k + 1)];
        const ang = Math.atan2(next.y - prev.y, next.x - prev.x);
        const off = wave(k) * f.rad * 0.6 * (k > 0 ? 1 : 0);
        return { x: p.x - Math.sin(ang) * off, y: p.y + Math.cos(ang) * off, ang };
      });
      const radius = (k: number) => {
        const t = k / (f.n - 1);
        return f.rad * Math.pow(1 - t, 0.55) * (0.5 + 0.5 * Math.sin(Math.min(1, t * 3.6 + 0.12) * (Math.PI / 2)));
      };

      // tail fin
      const tail = pts[f.n - 1];
      const tailAng = pts[f.n - 1].ang + Math.sin(f.phase - f.n * 0.55) * 0.5;
      const tl = f.rad * 2.1;
      c.fillStyle = body;
      c.globalAlpha = 0.85;
      c.beginPath();
      c.moveTo(tail.x * S, tail.y * S);
      c.lineTo((tail.x + Math.cos(tailAng + 0.5) * tl) * S, (tail.y + Math.sin(tailAng + 0.5) * tl) * S);
      c.lineTo((tail.x + Math.cos(tailAng) * tl * 0.55) * S, (tail.y + Math.sin(tailAng) * tl * 0.55) * S);
      c.lineTo((tail.x + Math.cos(tailAng - 0.5) * tl) * S, (tail.y + Math.sin(tailAng - 0.5) * tl) * S);
      c.closePath();
      c.fill();

      // pectoral fins
      const fp = pts[2];
      const flap = Math.sin(f.phase * 0.8) * 0.35;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.ellipse(
          (fp.x - Math.sin(fp.ang) * side * (f.rad * 0.95)) * S,
          (fp.y + Math.cos(fp.ang) * side * (f.rad * 0.95)) * S,
          f.rad * 0.95 * S,
          f.rad * 0.38 * S,
          fp.ang + side * (0.9 + flap),
          0,
          Math.PI * 2,
        );
        c.fill();
      }

      // body
      c.globalAlpha = 1;
      for (let k = 0; k < f.n; k++) {
        const r = radius(k);
        if (r < 0.2) continue;
        c.fillStyle = body;
        c.beginPath();
        c.arc(pts[k].x * S, pts[k].y * S, r * S, 0, Math.PI * 2);
        c.fill();
      }
      // accent patches along the back
      c.fillStyle = 'rgb(96,140,255)';
      for (let k = 0; k < f.n; k++) {
        if (!f.patches[k]) continue;
        const r = radius(k) * 0.5;
        c.beginPath();
        c.arc(pts[k].x * S, pts[k].y * S, r * S, 0, Math.PI * 2);
        c.fill();
      }
      // eyes
      const h = pts[0];
      c.fillStyle = 'rgb(24,22,20)';
      for (const side of [-1, 1]) {
        c.beginPath();
        c.arc((h.x + Math.cos(h.ang + Math.PI) * -0.9 - Math.sin(h.ang) * side * f.rad * 0.5) * S, (h.y + Math.sin(h.ang + Math.PI) * -0.9 + Math.cos(h.ang) * side * f.rad * 0.5) * S, 0.5 * S, 0, Math.PI * 2);
        c.fill();
      }
    };

    const render = (dt: number) => {
      // 1. fish and ripples into the raster
      rctx.clearRect(0, 0, ras.width, ras.height);
      for (const r of ripples) {
        rctx.globalAlpha = Math.max(0, 0.4 * (1 - r.age / 1.6));
        rctx.strokeStyle = 'rgb(230,224,216)';
        rctx.lineWidth = 1.1 * 2;
        rctx.beginPath();
        rctx.arc(r.x * 2, r.y * 2, r.r * 2, 0, Math.PI * 2);
        rctx.stroke();
      }
      rctx.globalAlpha = 1;
      fish.forEach((f) => drawFish(rctx, f));
      const data = rctx.getImageData(0, 0, ras.width, ras.height).data;

      // 2. raster -> per-cell coverage and colour, with slow fade (trails)
      const decay = Math.exp(-dt * 4.2);
      const stride = ras.width * 4;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          let a = 0;
          let r = 0;
          let g = 0;
          let b = 0;
          const o = cy * 2 * stride + cx * 2 * 4;
          for (const q of [o, o + 4, o + stride, o + stride + 4]) {
            const pa = data[q + 3] / 255;
            a += pa;
            r += data[q] * pa;
            g += data[q + 1] * pa;
            b += data[q + 2] * pa;
          }
          const i = cy * cols + cx;
          const cov = a / 4;
          let v = trailV[i] * decay;
          if (cov > 0.04) {
            const rr = r / a;
            const bb = b / a;
            const lum = (rr + g / a + bb) / 3;
            const cls = bb - rr > 38 ? 1 : lum < 90 ? 2 : 0;
            if (cov >= v) {
              trailV[i] = cov;
              trailC[i] = cls;
              v = cov;
            } else trailV[i] = v;
          } else trailV[i] = v < 0.025 ? 0 : v;
        }
      }

      // 3. cells onto the visible canvas
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const colors = ['236,230,222', '107,149,255', '34,31,28'];
      for (let cls = 0; cls < 3; cls++) {
        ctx.fillStyle = `rgb(${colors[cls]})`;
        for (let i = 0; i < trailV.length; i++) {
          const v = trailV[i];
          if (v < 0.05 || trailC[i] !== cls) continue;
          const cx = i % cols;
          const cy = (i / cols) | 0;
          const size = CELL - 1.3;
          const s = v > 0.45 ? size : size * (0.4 + (v / 0.45) * 0.6);
          const off = (CELL - s) / 2;
          ctx.globalAlpha = Math.min(1, (v > 0.45 ? 0.55 + v * 0.45 : v * 1.35)) * jitter[i] * (cls === 2 ? 1.1 : 0.92);
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
      fish.forEach((f, idx) => {
        for (let k = 0; k < f.n; k++) {
          const d = Math.hypot(f.spine[k].x - x, f.spine[k].y - y);
          if (d < f.rad * (1 - k / f.n) + pad && d < bd) {
            bd = d;
            best = idx;
          }
        }
      });
      return best;
    };

    const placeLabel = () => {
      if (hovered < 0) {
        tag.style.opacity = '0';
        return;
      }
      const f = fish[hovered];
      tag.textContent = f.item.title;
      tag.style.transform = `translate(${f.x * CELL + 18}px, ${f.y * CELL - 28}px)`;
      tag.style.opacity = '1';
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      hovered = ptr.on ? hit(ptr.x, ptr.y, 1.8) : -1;
      cv.style.cursor = hovered >= 0 ? 'pointer' : 'default';
      step(dt);
      render(dt);
      placeLabel();
    };

    const local = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      ptr.x = p.x;
      ptr.y = p.y;
      ptr.on = e.pointerType !== 'touch';
    };
    const onLeave = () => {
      ptr.on = false;
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      const idx = hit(p.x, p.y, e.pointerType === 'touch' ? 3.5 : 1.8);
      if (idx >= 0) {
        router.push(`/projects/${fish[idx].item.slug}`);
        return;
      }
      ripples.push({ x: p.x / CELL, y: p.y / CELL, r: 1, age: 0 });
    };

    resize();
    if (reduce) {
      // no loop: let the fish spread out a little, then draw one still frame
      for (let i = 0; i < 90; i++) step(1 / 30);
      render(1);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) {
        for (let i = 0; i < 90; i++) step(1 / 30);
        render(1);
      }
    });
    ro.observe(box);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('pointerdown', onDown);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerleave', onLeave);
      cv.removeEventListener('pointerdown', onDown);
    };
  }, [items, router]);

  return (
    <div ref={wrap} className="pond__canvas" style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvas} aria-hidden="true" />
      <span ref={label} className="pond__label" aria-hidden="true" />
    </div>
  );
}

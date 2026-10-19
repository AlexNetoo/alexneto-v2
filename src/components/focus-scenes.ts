/**
 * Interactive canvas scenes for the Focus Areas section, one per area. Plain canvas 2D, no library.
 * Every scene is grayscale (drawn in the page's ink colour), ambient when idle and reactive to the pointer.
 *
 *   strategy   a decision tree: hover previews the path to any node, click sets it as the goal
 *
 * Product design and UX / UI design are not canvas scenes: they are DOM components
 * (ProductFlow.tsx, a working prototype; UiDashboard.tsx, taken apart with ExplodedView.tsx).
 *   mentoring  a mentor circle follows the pointer with learners orbiting it; click adds a learner
 */

export type Kind = 'product' | 'strategy' | 'ux' | 'mentoring';
export type Ptr = { x: number; y: number; on: boolean };
export type Scene = {
  /** Advance the simulation by `dt` seconds (already clamped). `t` is seconds since the scene started. */
  step(dt: number, p: Ptr, t: number): void;
  draw(ctx: CanvasRenderingContext2D, ink: string, p: Ptr, t: number): void;
  click(p: Ptr): void;
};

const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** `ink` is a CSS colour; draw it at a given alpha without parsing it. */
function alpha(ctx: CanvasRenderingContext2D, a: number) {
  ctx.globalAlpha = clamp(a, 0, 1);
}

/* ----------------------------------------------------------------- strategy */

function strategy(w: number, h: number): Scene {
  type Node = { x: number; y: number; parent: number; depth: number; phase: number };
  const nodes: Node[] = [];
  const add = (nx: number, ny: number, parent: number, depth: number) =>
    nodes.push({ x: nx * w, y: ny * h, parent, depth, phase: nodes.length * 1.7 }) - 1;
  const root = add(0.11, 0.5, -1, 0);
  const lvl1 = [add(0.34, 0.3, root, 1), add(0.34, 0.7, root, 1)];
  const lvl2 = [0.17, 0.39, 0.61, 0.83].map((y, i) => add(0.58, y, lvl1[i < 2 ? 0 : 1], 2));
  const leaves: number[] = [];
  lvl2.forEach((n) => {
    const y = nodes[n].y / h;
    leaves.push(add(0.85, y - 0.075, n, 3), add(0.85, y + 0.075, n, 3));
  });
  const isLeaf = (i: number) => nodes[i].depth === 3;
  let goal = leaves[5];
  let hover = -1;
  let pulse = 0; // seconds since the goal last changed, drives the ring
  const pos = (i: number, t: number) => ({
    x: nodes[i].x + Math.sin(t * 0.8 + nodes[i].phase) * 2.5,
    y: nodes[i].y + Math.cos(t * 0.7 + nodes[i].phase) * 2.5,
  });
  const pathTo = (i: number) => {
    const out: number[] = [];
    for (let n = i; n >= 0; n = nodes[n].parent) out.push(n);
    return out.reverse();
  };
  const edge = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2;
    return { a, b, c1: { x: mx, y: a.y }, c2: { x: mx, y: b.y } };
  };
  const bez = (e: ReturnType<typeof edge>, k: number) => {
    const u = 1 - k;
    return {
      x: u ** 3 * e.a.x + 3 * u * u * k * e.c1.x + 3 * u * k * k * e.c2.x + k ** 3 * e.b.x,
      y: u ** 3 * e.a.y + 3 * u * u * k * e.c1.y + 3 * u * k * k * e.c2.y + k ** 3 * e.b.y,
    };
  };
  const nearest = (p: Ptr, t: number) => {
    if (!p.on) return -1;
    let best = -1;
    let bd = 44;
    nodes.forEach((_, i) => {
      const q = pos(i, t);
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  let clock = 0;

  return {
    step(dt, p, t) {
      clock = t;
      pulse += dt;
      hover = nearest(p, t);
    },
    draw(ctx, ink, _p, t) {
      const focus = hover >= 0 ? hover : goal;
      const lit = new Set(pathTo(focus));
      const goalPath = new Set(pathTo(goal));
      const fade = Math.min(1, t * 1.6);

      // edges
      nodes.forEach((n, i) => {
        if (n.parent < 0) return;
        const e = edge(pos(n.parent, t), pos(i, t));
        const on = lit.has(i) && lit.has(n.parent);
        ctx.strokeStyle = ink;
        ctx.lineWidth = on ? 2 : 1.2;
        alpha(ctx, fade * (on ? 0.9 : goalPath.has(i) && hover >= 0 ? 0.28 : 0.2));
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.bezierCurveTo(e.c1.x, e.c1.y, e.c2.x, e.c2.y, e.b.x, e.b.y);
        ctx.stroke();
        if (on) {
          // a point travelling down the lit path
          const k = (t * 0.55 + n.depth * 0.33) % 1;
          const d = bez(e, k);
          ctx.fillStyle = ink;
          alpha(ctx, fade);
          ctx.beginPath();
          ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // nodes
      nodes.forEach((n, i) => {
        const q = pos(i, t);
        const on = lit.has(i);
        const r = i === root ? 11 : i === goal ? 12 : on ? 9 : 6.5;
        ctx.beginPath();
        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
        if (on || i === root) {
          ctx.fillStyle = ink;
          alpha(ctx, fade);
          ctx.fill();
        } else {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.5;
          alpha(ctx, fade * 0.55);
          ctx.stroke();
        }
        if (i === goal) {
          const k = (pulse * 0.9) % 1.4;
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.5;
          alpha(ctx, fade * (1 - k / 1.4) * 0.8);
          ctx.beginPath();
          ctx.arc(q.x, q.y, 14 + k * 22, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
      void clock;
    },
    click(p) {
      const i = nearest(p, clock);
      if (i < 0) return;
      // an inner node picks the first leaf below it
      let n = i;
      while (!isLeaf(n)) n = nodes.findIndex((c) => c.parent === n);
      if (n !== goal) {
        goal = n;
        pulse = 0;
      }
    },
  };
}

/* ---------------------------------------------------------------- mentoring */

function mentoring(w: number, h: number): Scene {
  const rnd = mulberry(11);
  const S = Math.min(w, h);
  const mentor = { x: w / 2, y: h / 2, vx: 0, vy: 0 };
  const radii = [S * 0.17, S * 0.26, S * 0.35];
  type L = { a: number; ring: number; speed: number; r: number; x: number; y: number; vx: number; vy: number };
  const learners: L[] = [];
  const spawn = (n: number) => {
    for (let i = 0; i < n && learners.length < 16; i++) {
      const ring = learners.length % 3;
      learners.push({
        a: rnd() * Math.PI * 2,
        ring,
        speed: (0.35 + rnd() * 0.3) * (ring % 2 ? -1 : 1) * (1 - ring * 0.15),
        r: 5 + rnd() * 5,
        x: rnd() * w,
        y: rnd() * h,
        vx: 0,
        vy: 0,
      });
    }
  };
  spawn(7);

  return {
    step(dt, p, t) {
      const tx = p.on ? p.x : w / 2 + Math.sin(t * 0.45) * S * 0.16;
      const ty = p.on ? p.y : h / 2 + Math.cos(t * 0.33) * S * 0.12;
      // the mentor follows the pointer with a soft spring
      mentor.vx += ((tx - mentor.x) * 14 - mentor.vx * 5.5) * dt;
      mentor.vy += ((ty - mentor.y) * 14 - mentor.vy * 5.5) * dt;
      mentor.x += mentor.vx * dt;
      mentor.y += mentor.vy * dt;
      for (const l of learners) {
        l.a += l.speed * dt;
        const gx = mentor.x + Math.cos(l.a) * radii[l.ring];
        const gy = mentor.y + Math.sin(l.a) * radii[l.ring];
        l.vx += ((gx - l.x) * 26 - l.vx * 6) * dt;
        l.vy += ((gy - l.y) * 26 - l.vy * 6) * dt;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
      }
    },
    draw(ctx, ink, p, t) {
      const fade = Math.min(1, t * 1.6);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      for (const r of radii) {
        alpha(ctx, fade * 0.13);
        ctx.beginPath();
        ctx.arc(mentor.x, mentor.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // faint links from the mentor to each learner
      for (const l of learners) {
        alpha(ctx, fade * 0.12);
        ctx.beginPath();
        ctx.moveTo(mentor.x, mentor.y);
        ctx.lineTo(l.x, l.y);
        ctx.stroke();
      }
      // mentor
      ctx.lineWidth = 1.75;
      alpha(ctx, fade * (p.on ? 0.95 : 0.7));
      ctx.beginPath();
      ctx.arc(mentor.x, mentor.y, S * 0.085, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ink;
      alpha(ctx, fade);
      ctx.beginPath();
      ctx.arc(mentor.x, mentor.y, 4, 0, Math.PI * 2);
      ctx.fill();
      // learners
      ctx.fillStyle = ink;
      for (const l of learners) {
        alpha(ctx, fade * 0.9);
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    click() {
      spawn(1);
      // the newcomer arrives from the edge
      const l = learners[learners.length - 1];
      l.x = rnd() < 0.5 ? -10 : w + 10;
      l.y = rnd() * h;
    },
  };
}

export function createScene(kind: Exclude<Kind, 'ux' | 'product'>, w: number, h: number): Scene {
  switch (kind) {
    case 'strategy':
      return strategy(w, h);
    default:
      return mentoring(w, h);
  }
}

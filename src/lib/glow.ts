/**
 * Cursor glow for a wordmark layer. The layer is masked to the letters AND to a radial gradient centred on
 * `--mx / --my`, so only the letters near the pointer show what is inside it (the liquid gradient).
 *
 * Playful bits: the blob follows the pointer on an under-damped spring (it overshoots and wobbles), swells with
 * pointer speed, bursts when you click, and its colour shifts with the pointer's position along the letters
 * (`--hue`). The layer is marked `data-near` while the pointer is within reach so it can fade in and out.
 * No-op without a hover pointer or with reduced motion. Returns a cleanup function.
 */
export function trackGlow(el: HTMLElement, { radius = 280, onNear }: { radius?: number; onNear?: (near: boolean) => void } = {}) {
  if (typeof window === 'undefined') return () => {};
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const target = { x: -9999, y: -9999 };
  const pos = { x: -9999, y: -9999, vx: 0, vy: 0 };
  let rad = radius * 0.6; // eased radius
  let burst = 0; // click pulse, decays to 0
  let near = false;
  let raf = 0;
  let last = 0;

  const STIFFNESS = 190;
  const DAMPING = 10; // low enough to overshoot, so the blob wobbles

  const loop = (now: number) => {
    raf = 0;
    const dt = clamp((now - (last || now)) / 1000, 0.001, 1 / 30);
    last = now;
    const rect = el.getBoundingClientRect();
    const s = rect.width / (el.offsetWidth || rect.width || 1) || 1;

    const dx = Math.max(rect.left - target.x, 0, target.x - rect.right);
    const dy = Math.max(rect.top - target.y, 0, target.y - rect.bottom);
    const isNear = Math.hypot(dx, dy) < radius * 0.8;
    if (isNear !== near) {
      near = isNear;
      el.dataset.near = String(near);
      onNear?.(near);
    }
    if (!near) {
      pos.x = -9999;
      pos.vx = pos.vy = 0;
      last = 0;
      return;
    }
    if (pos.x < -9000) {
      pos.x = target.x;
      pos.y = target.y;
    }

    // spring toward the pointer (two substeps keep it stable)
    for (let i = 0; i < 2; i++) {
      const h = dt / 2;
      pos.vx += ((target.x - pos.x) * STIFFNESS - pos.vx * DAMPING) * h;
      pos.vy += ((target.y - pos.y) * STIFFNESS - pos.vy * DAMPING) * h;
      pos.x += pos.vx * h;
      pos.y += pos.vy * h;
    }
    // the faster the blob moves, the bigger it gets; a click makes it pop
    const speed = Math.hypot(pos.vx, pos.vy);
    burst *= Math.exp(-dt * 3.2);
    const wantR = radius * (0.85 + clamp(speed / 1600, 0, 0.75)) * (1 + burst * 0.9);
    rad += (wantR - rad) * (1 - Math.exp(-dt * 9));

    const fx = clamp((pos.x - rect.left) / (rect.width || 1), 0, 1);
    el.style.setProperty('--mx', `${((pos.x - rect.left) / s).toFixed(1)}px`);
    el.style.setProperty('--my', `${((pos.y - rect.top) / s).toFixed(1)}px`);
    el.style.setProperty('--r', `${(rad / s).toFixed(1)}px`);
    el.style.setProperty('--hue', `${((fx - 0.5) * 150).toFixed(1)}deg`);
    raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    target.x = e.clientX;
    target.y = e.clientY;
    kick();
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || !near) return;
    burst = 1;
    kick();
  };
  const onLeaveWindow = () => {
    target.x = -9999;
    target.y = -9999;
    kick();
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeaveWindow);
  // the layer also moves under a still pointer (scroll), so re-check on scroll
  window.addEventListener('scroll', kick, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    document.documentElement.removeEventListener('pointerleave', onLeaveWindow);
    window.removeEventListener('scroll', kick);
    if (raf) cancelAnimationFrame(raf);
  };
}

/** Bright blues for the glow (RGB), read by the liquid gradient canvas. */
export const GLOW_COLORS: [number, number, number][] = [
  [24, 70, 214],
  [64, 138, 255],
  [176, 210, 255],
];

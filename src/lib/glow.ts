/**
 * Cursor glow for a wordmark layer. The layer is masked to the letters AND to a radial gradient centred on
 * `--mx / --my`, so only the letters near the pointer show what is inside it (the liquid gradient).
 * The pointer position is eased, converted into the layer's own (unscaled) pixels, and the layer is marked
 * `data-near` while the pointer is within reach so it can fade in and out. No-op without a hover pointer or
 * with reduced motion. Returns a cleanup function.
 */
export function trackGlow(el: HTMLElement, { radius = 280, onNear }: { radius?: number; onNear?: (near: boolean) => void } = {}) {
  if (typeof window === 'undefined') return () => {};
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const target = { x: -9999, y: -9999 };
  const cur = { x: -9999, y: -9999 };
  let near = false;
  let raf = 0;

  const loop = () => {
    raf = 0;
    const rect = el.getBoundingClientRect();
    const s = rect.width / (el.offsetWidth || rect.width || 1) || 1;
    // reach: the pointer is inside the box, or within `radius` px of it
    const dx = Math.max(rect.left - target.x, 0, target.x - rect.right);
    const dy = Math.max(rect.top - target.y, 0, target.y - rect.bottom);
    const isNear = Math.hypot(dx, dy) < radius * 0.8;
    if (isNear !== near) {
      near = isNear;
      el.dataset.near = String(near);
      onNear?.(near);
    }
    if (near) {
      if (cur.x < -9000) {
        cur.x = target.x;
        cur.y = target.y;
      }
      cur.x += (target.x - cur.x) * 0.18;
      cur.y += (target.y - cur.y) * 0.18;
      el.style.setProperty('--mx', `${((cur.x - rect.left) / s).toFixed(1)}px`);
      el.style.setProperty('--my', `${((cur.y - rect.top) / s).toFixed(1)}px`);
      el.style.setProperty('--r', `${(radius / s).toFixed(1)}px`);
      raf = requestAnimationFrame(loop);
    } else {
      cur.x = -9999;
    }
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
  const onLeaveWindow = () => {
    target.x = -9999;
    target.y = -9999;
    kick();
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeaveWindow);
  // the layer also moves under a still pointer (scroll), so re-check on scroll
  window.addEventListener('scroll', kick, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onMove);
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

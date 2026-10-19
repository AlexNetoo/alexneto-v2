'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { LiquidGradientCanvas } from './liquid-index-canvas';
import { createScene, type Kind, type Ptr, type Scene } from './focus-scenes';
import { UiDashboard } from './UiDashboard';
import { ProductFlow } from './ProductFlow';

type Item = { title: string; caption: string; description: string; graphic: Kind };

/** Hint shown on the stage, per area (what the pointer does). */
const HINT: Record<Kind, string> = {
  product: 'Click through the flow',
  strategy: 'Hover to trace a path, click to set the goal',
  ux: 'Click the screen to take it apart',
  mentoring: 'Move to guide, click to add a learner',
};

/** The liquid gradient behind each stage (useLayouts liquid-index): same blues, a different swirl per area. */
const LIQUID: Record<Kind, { seed: number; colors: [number, number, number][] }> = {
  product: { seed: 648, colors: [[4, 8, 26], [20, 52, 160], [74, 128, 248]] },
  strategy: { seed: 291, colors: [[4, 10, 30], [14, 66, 176], [98, 164, 255]] },
  ux: { seed: 417, colors: [[8, 6, 32], [40, 52, 196], [124, 144, 255]] },
  mentoring: { seed: 133, colors: [[4, 14, 32], [10, 86, 178], [84, 176, 242]] },
};

const SPRING = { type: 'spring' as const, bounce: 0, duration: 0.4 };

/**
 * Focus Areas: a large-type list on the left (spring motion, in the liquid-index style), and on the right one
 * interactive scene per area over a live liquid-gradient stage. The scene follows the open item.
 * With reduced motion the scenes render once, settled, and stay still.
 */
export function FocusAreas({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const kind = items[active].graphic;
  const reduce = useReducedMotion();

  useEffect(() => {
    if (kind === 'ux' || kind === 'product') return; // those areas are DOM components, not canvas scenes
    const host = stage.current;
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!host || !cv || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ptr: Ptr = { x: 0, y: 0, on: false };
    let scene: Scene | null = null;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let t = 0;
    let last = 0;
    let raf = 0;
    let visible = true;
    const ink = '#ffffff'; // the stage is always a dark blue gradient, in both themes
    const build = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      scene = createScene(kind as Exclude<Kind, 'ux' | 'product'>, w, h);
      t = 0;
      if (reduced) {
        // settle the scene without animating, then draw it once
        for (let i = 0; i < 180; i++) scene.step(1 / 60, ptr, (t += 1 / 60));
        paint();
      }
    };
    const paint = () => {
      if (!scene) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      scene.draw(ctx, ink, ptr, t);
    };
    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now;
      t += dt;
      scene?.step(dt, ptr, t);
      paint();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reduced || raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const at = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
    };
    const onMove = (e: PointerEvent) => {
      at(e);
      ptr.on = true;
    };
    const onLeave = () => {
      ptr.on = false;
    };
    const onDown = (e: PointerEvent) => {
      at(e);
      ptr.on = true;
      scene?.click(ptr);
      if (reduced) paint();
    };
    // touch: the finger is only a pointer while it is down
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') ptr.on = false;
    };

    build();
    const ro = new ResizeObserver(() => {
      build();
      start();
    });
    ro.observe(host);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) start();
    });
    io.observe(host);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onLeave);
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerleave', onLeave);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onLeave);
    };
  }, [kind]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    setActive(n);
    (e.currentTarget.closest('ol')?.querySelectorAll<HTMLButtonElement>('.focus__toggle')[n])?.focus();
  };

  return (
    <div className="focus">
      <ol className="focus__list">
        {items.map((it, i) => {
          const open = i === active;
          return (
            <li key={it.title} className={`focus__item${open ? ' is-open' : ''}`}>
              <button
                type="button"
                className="focus__toggle"
                aria-expanded={open}
                aria-controls={`focus-panel-${i}`}
                id={`focus-toggle-${i}`}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
              >
                <span className="t-mono focus__num">{String(i + 1).padStart(2, '0')}</span>
                <motion.span className="focus__title" animate={{ x: open ? 10 : 0 }} transition={reduce ? { duration: 0 } : SPRING}>
                  {it.title}
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="panel"
                    className="focus__panel"
                    id={`focus-panel-${i}`}
                    role="region"
                    aria-labelledby={`focus-toggle-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={reduce ? { duration: 0 } : SPRING}
                  >
                    <div className="focus__panel-in">
                      <p className="t-body-s muted">{it.caption}</p>
                      <p className="t-body-m">{it.description}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
      <div ref={stage} className="focus__stage" aria-hidden={kind === 'strategy' || kind === 'mentoring' ? true : undefined}>
        <div className="focus__liquid" aria-hidden="true">
          <LiquidGradientCanvas colors={LIQUID[kind].colors} seed={LIQUID[kind].seed} paused={!!reduce} />
        </div>
        {kind === 'ux' ? <UiDashboard /> : kind === 'product' ? <ProductFlow /> : <canvas ref={canvas} className="focus__canvas" />}
        <span className="focus__hint t-label">{HINT[kind]}</span>
      </div>
    </div>
  );
}

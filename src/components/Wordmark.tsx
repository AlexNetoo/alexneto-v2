'use client';

import { useScroll } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { GLOW_COLORS, trackGlow } from '@/lib/glow';
import { LiquidGradientCanvas } from './liquid-index-canvas';

/** Height / width of /alex-neto-wordmark.svg (1492.31 x 205.221, from the Figma file). */
const RATIO = 205.221 / 1492.31;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The ALEX NETO wordmark. On the home page it starts huge along the bottom of the first screen and,
 * as you scroll, shrinks and docks at the top centre of the nav (position and size are driven by the scroll
 * position, so it scrubs both ways). On every other page it is already docked.
 * Two fixed layers draw it: one blends with `difference` (it inverts over photos), one with `saturation`
 * (so the inverted wordmark stays grey instead of turning into the photo's opposite colour).
 */
export function Wordmark() {
  const pathname = usePathname();
  const docked = pathname !== '/';
  const main = useRef<HTMLAnchorElement>(null);
  const sat = useRef<HTMLSpanElement>(null);
  const glow = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);
  const [near, setNear] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const a = main.current;
    const b = sat.current;
    const gl = glow.current;
    if (!a || !b || !gl) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const geo = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const phone = vw < 700;
      const navH = phone ? 72 : 88;
      const W0 = vw * (phone ? 0.9 : 0.777); // Figma: 1492 of 1920
      const H0 = W0 * RATIO;
      const W1 = phone ? 80 : clamp(vw * 0.094, 110, 200); // Figma: 180 at 1920
      const H1 = W1 * RATIO;
      return {
        W0,
        H0,
        s1: W1 / W0,
        x0: (vw - W0) / 2,
        // phones have no room beside the avatar and pills for a centred title: dock it after the avatar
        x1: phone ? 66 : (vw - W1) / 2,
        // Figma: the wordmark's bottom edge sits a hair below the fold
        y0: vh - H0 + vh * 0.007,
        y1: (navH - H1) / 2,
        // scroll distance until the project grid reaches its docked position (nav + 48px)
        D: Math.max(240, vh - (navH + 48)),
      };
    };
    let g = geo();

    const rawOf = (y: number) => (docked || reduced ? 1 : clamp(y / g.D, 0, 1));
    const render = (raw: number) => {
      const t = raw * raw * raw * (raw * (raw * 6 - 15) + 10); // smootherstep: gentler start and finish than smoothstep
      const x = lerp(g.x0, g.x1, t);
      const Y = lerp(g.y0, g.y1, t);
      const S = Math.pow(g.s1, t); // shrink at a constant rate, not linearly in size
      const tf = `translate3d(${x}px, ${Y}px, 0) scale(${S})`;
      a.style.transform = tf;
      b.style.transform = tf;
      gl.style.transform = tf;
      a.style.pointerEvents = raw > 0.98 ? 'auto' : 'none';
      a.tabIndex = raw > 0.98 ? 0 : -1;
    };

    // The drawn progress eases toward the scroll position (frame-rate independent), so the wordmark glides
    // even when the wheel moves in steps, and settles softly instead of stopping dead.
    let target = rawOf(scrollY.get());
    let cur = target;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - (last || now)) / 1000 || 0.016);
      last = now;
      cur += (target - cur) * (1 - Math.exp(-dt * 11));
      if (Math.abs(target - cur) < 0.0003) {
        cur = target;
        last = 0;
      } else {
        raf = requestAnimationFrame(tick);
      }
      render(cur);
    };
    const apply = (y: number) => {
      target = rawOf(y);
      if (reduced || docked) {
        cur = target;
        render(cur);
      } else if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };
    const size = () => {
      for (const el of [a, b, gl]) {
        el.style.width = `${g.W0}px`;
        el.style.height = `${g.H0}px`;
      }
    };
    size();
    render(cur);
    a.style.opacity = '1';
    b.style.opacity = '1';
    gl.style.visibility = 'visible';

    const off = scrollY.on('change', apply);
    const onResize = () => {
      g = geo();
      size();
      target = cur = rawOf(scrollY.get());
      render(cur);
    };
    window.addEventListener('resize', onResize);
    const stopGlow = trackGlow(gl, {
      radius: 300,
      onNear: (n) => {
        setNear(n);
        if (n) setArmed(true);
      },
    });
    return () => {
      off();
      stopGlow();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [docked, scrollY]);

  return (
    <>
      <span ref={sat} className="wordmark-sat" aria-hidden="true">
        <span className="wordmark__ink" />
      </span>
      <span ref={glow} className="wordmark-glow glow" aria-hidden="true">
        {armed && <LiquidGradientCanvas colors={GLOW_COLORS} seed={377} speed={0.8} idle={!near} />}
      </span>
      <Link ref={main} href="/" className="wordmark" aria-label="Alex Neto, home">
        <span className="wordmark__ink" />
      </Link>
    </>
  );
}

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

    const apply = (y: number) => {
      const raw = docked || reduced ? 1 : clamp(y / g.D, 0, 1);
      const t = raw * raw * (3 - 2 * raw); // smoothstep
      const x = lerp(g.x0, g.x1, t);
      const Y = lerp(g.y0, g.y1, t);
      const S = lerp(1, g.s1, t);
      const tf = `translate3d(${x}px, ${Y}px, 0) scale(${S})`;
      a.style.transform = tf;
      b.style.transform = tf;
      gl.style.transform = tf;
      a.style.pointerEvents = raw > 0.98 ? 'auto' : 'none';
      a.tabIndex = raw > 0.98 ? 0 : -1;
    };
    const size = () => {
      for (const el of [a, b, gl]) {
        el.style.width = `${g.W0}px`;
        el.style.height = `${g.H0}px`;
      }
    };
    size();
    apply(scrollY.get());
    a.style.opacity = '1';
    b.style.opacity = '1';
    gl.style.visibility = 'visible';

    const off = scrollY.on('change', apply);
    const onResize = () => {
      g = geo();
      size();
      apply(scrollY.get());
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

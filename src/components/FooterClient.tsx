'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { GLOW_COLORS, trackGlow } from '@/lib/glow';
import { site, whatsappUrl } from '@/data/site';
import { BookACallLink } from './get-in-touch';
import { LiquidGradientCanvas } from './liquid-index-canvas';

/** "Get in touch" (WhatsApp, like the live site) and a one-click "Copy email". */
export function FooterActions() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };
  return (
    <div className="cta-actions">
      <BookACallLink href={whatsappUrl} className="w-48" />
      <button type="button" className="btn btn--lg btn--ghost" onClick={copy} aria-live="polite">
        {copied ? 'Copied ✓' : 'Copy email'}
      </button>
    </div>
  );
}

/** Porto's local time (Europe/Lisbon), ticking quietly. Renders the place only until it has mounted. */
export function LocalTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' }).format(new Date()));
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <p className="footer-time">
      <span className="footer-time__dot" aria-hidden="true" />
      {site.location}
      {time && <span className="footer-time__clock"> · {time} local time</span>}
    </p>
  );
}

export function BackToTop() {
  return (
    <button type="button" className="to-top" onClick={() => (window.__lenis ? window.__lenis.scrollTo(0, { duration: 1.4 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))} aria-label="Back to top">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}

/**
 * The giant wordmark at the very bottom. It rises into place as the footer scrolls into view, and the letters
 * near the cursor fill with the animated blue liquid gradient (useLayouts liquid index canvas).
 */
export function FooterMark() {
  const ref = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false); // mount the WebGL canvas the first time the cursor gets close
  const [near, setNear] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const y = useTransform(scrollYProgress, [0, 1], ['42%', '0%']);

  useEffect(() => {
    if (!glow.current) return;
    return trackGlow(glow.current, {
      radius: 300,
      onNear: (n) => {
        setNear(n);
        if (n) setArmed(true);
      },
    });
  }, []);

  return (
    <div ref={ref} className="footer-mark" aria-hidden="true">
      <motion.div className="footer-mark__rise" style={reduce ? undefined : { y }}>
        <span className="footer-mark__ink" />
        <span ref={glow} className="footer-mark__glow glow">
          {armed && <LiquidGradientCanvas colors={GLOW_COLORS} seed={377} speed={0.8} idle={!near} />}
        </span>
      </motion.div>
    </div>
  );
}

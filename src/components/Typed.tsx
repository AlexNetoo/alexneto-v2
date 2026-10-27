'use client';

import { useEffect, useState } from 'react';

/** Types its lines out one character at a time, with a blinking caret. Shows everything at once for reduced motion. */
export function Typed({ lines, delay = 500, speed = 32 }: { lines: string[]; delay?: number; speed?: number }) {
  const total = lines.reduce((n, l) => n + l.length, 0);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(total);
      return;
    }
    let i = 0;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        i += 1;
        setN(i);
        if (i >= total) window.clearInterval(id);
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [total, delay, speed]);

  let left = n;
  return (
    <p aria-label={lines.join(' ')}>
      {lines.map((l, i) => {
        const shown = l.slice(0, Math.max(0, left));
        left -= l.length;
        return (
          <span key={i} aria-hidden="true">
            {shown}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
      <span className="caret" aria-hidden="true" />
    </p>
  );
}

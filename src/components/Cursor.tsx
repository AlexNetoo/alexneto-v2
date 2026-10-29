'use client';

import { useEffect, useRef } from 'react';

/** What the pointer is over: nothing special, something clickable, or a project image that opens full screen. */
type Mode = 'idle' | 'link' | 'shot';

/**
 * The pointer on the public site is a small dot. Over a link or button it swells a little, and over a project image
 * it becomes a larger disc with the full-screen corners, so you know a click opens the image. Mouse and trackpad
 * only: touch screens keep their own behaviour, and so does anyone whose device has no fine pointer.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dot.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const root = document.documentElement;
    root.classList.add('has-dot');

    let mode: Mode = 'idle';
    const set = (m: Mode) => {
      if (m === mode) return;
      mode = m;
      el.dataset.mode = m;
    };
    const modeOf = (t: EventTarget | null): Mode => {
      const n = t instanceof Element ? t : null;
      if (n?.closest('.shot')) return 'shot';
      if (n?.closest('a, button, input, textarea, select, summary, [role="button"]')) return 'link';
      return 'idle';
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      el.dataset.show = '1';
      set(modeOf(e.target));
    };
    const onDown = () => {
      el.dataset.down = '1';
    };
    const onUp = () => {
      delete el.dataset.down;
    };
    const onLeave = () => {
      delete el.dataset.show;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      root.classList.remove('has-dot');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={dot} className="dot" data-mode="idle" aria-hidden="true">
      <span className="dot__disc">
        <svg className="dot__icon" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
          <path d="M3.5 8V3.5H8M12 3.5h4.5V8M16.5 12v4.5H12M8 16.5H3.5V12" />
        </svg>
      </span>
    </div>
  );
}

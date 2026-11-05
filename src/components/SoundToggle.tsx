'use client';

import { useEffect, useRef, useState } from 'react';
import { createHouse, type House } from '@/lib/house';

const KEY = 'v2-sound';

/**
 * A small "sound" switch in the corner. Sound is on by default: browsers only allow audio after a user gesture, so
 * the music starts on the visitor's first click, tap or key press anywhere on the page. Turning it off is remembered
 * for the visit. The music is generated live (src/lib/house.ts) and keeps playing between pages, because this lives
 * in the site layout.
 */
export function SoundToggle() {
  const house = useRef<House | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [on, setOn] = useState(true);

  const play = async () => {
    if (!house.current) house.current = createHouse();
    if (house.current.playing) return;
    try {
      await house.current.start();
      setOn(true);
    } catch {
      setOn(false);
    }
  };

  const remember = (v: 'on' | 'off') => {
    try {
      sessionStorage.setItem(KEY, v);
    } catch {}
  };

  useEffect(() => {
    let off = false;
    try {
      off = sessionStorage.getItem(KEY) === 'off';
    } catch {}
    if (off) {
      setOn(false);
      return () => house.current?.stop();
    }
    // armed: the first gesture anywhere (except on the switch itself, which handles its own click) starts the music
    const first = (e: Event) => {
      if (button.current && e.target instanceof Node && button.current.contains(e.target)) return;
      disarm();
      void play();
    };
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    const disarm = () => events.forEach((t) => window.removeEventListener(t, first, true));
    events.forEach((t) => window.addEventListener(t, first, { capture: true, passive: true }));
    return () => {
      disarm();
      house.current?.stop();
    };
  }, []);

  const toggle = async () => {
    if (on) {
      house.current?.stop();
      setOn(false);
      remember('off');
    } else {
      remember('on');
      await play();
    }
  };

  return (
    <button
      ref={button}
      type="button"
      className={`sound${on ? ' is-on' : ''}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn the music off' : 'Turn the music on'}
    >
      <span className="sound__bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>sound {on ? 'on' : 'off'}</span>
    </button>
  );
}

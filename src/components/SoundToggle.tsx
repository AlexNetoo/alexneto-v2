'use client';

import { useEffect, useRef, useState } from 'react';
import { createHouse, type House } from '@/lib/house';

/**
 * A small "sound" switch in the corner. Browsers only allow audio after a click, so it starts off.
 * The music is generated live (src/lib/house.ts); it keeps playing while you move between pages,
 * because this lives in the site layout.
 */
export function SoundToggle() {
  const house = useRef<House | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => () => house.current?.stop(), []);

  const toggle = async () => {
    if (!house.current) house.current = createHouse();
    if (house.current.playing) {
      house.current.stop();
      setOn(false);
    } else {
      try {
        await house.current.start();
        setOn(true);
      } catch {
        setOn(false);
      }
    }
  };

  return (
    <button type="button" className={`sound${on ? ' is-on' : ''}`} onClick={toggle} aria-pressed={on} aria-label={on ? 'Turn the music off' : 'Turn the music on'}>
      <span className="sound__bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>sound {on ? 'on' : 'off'}</span>
    </button>
  );
}

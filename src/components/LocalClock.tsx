'use client';

import { useEffect, useState } from 'react';
import { site } from '@/data/site';

/** Porto's local time (Europe/Lisbon), top right. Empty until mounted, so it never mismatches on hydration. */
export function LocalClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' }).format(new Date()));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="clock" aria-hidden="true">
      <span>{site.location.split(',')[0].toLowerCase()}</span>
      <b>{time}</b>
    </div>
  );
}

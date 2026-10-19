'use client';

import { useEffect, useState } from 'react';
import { whatsappUrl } from '@/data/site';

/** The pill pinned to the bottom-left of project pages. It steps aside once the footer comes into view. */
export function FloatingCta() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { rootMargin: '0px 0px -25% 0px' });
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <a className="floating-cta" data-hidden={hidden} href={whatsappUrl} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : 0}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={4 + (i % 3) * 7} cy={4 + Math.floor(i / 3) * 7} r="1.6" fill="currentColor" />
        ))}
      </svg>
      Let’s work together
    </a>
  );
}

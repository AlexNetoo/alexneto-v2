'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { metaLine, type Project } from '@/data/projects';

/** A horizontal rail of project cards. The wheel and arrow keys scroll it sideways; touch swipes natively. */
export function ProjectRail({ projects }: { projects: Project[] }) {
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const el = rail.current;
    if (!el) return;
    if (e.key === 'ArrowRight') el.scrollBy({ left: el.clientWidth * 0.5, behavior: 'smooth' });
    if (e.key === 'ArrowLeft') el.scrollBy({ left: -el.clientWidth * 0.5, behavior: 'smooth' });
  };

  return (
    <div ref={rail} className="rail" onKeyDown={onKey}>
      {projects.map((p, i) => {
        const img = p.gallery[0] ?? p.cover;
        return (
          <Link key={p.slug} href={`/projects/${p.slug}`} className="pcard rise" style={{ ['--d' as string]: `${0.1 + i * 0.07}s` }}>
            <div className="pcard__media">
              {img.animated ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.src} alt="" />
              ) : (
                <Image src={img.src} alt="" fill quality={80} sizes="(max-width: 899px) 82vw, 58vw" priority={i < 2} />
              )}
              <span className="pcard__view">view project ↗</span>
            </div>
            <div className="pcard__meta">
              <span className="pcard__title">{p.title}</span>
              {p.year && <span className="pcard__year">{p.year}</span>}
            </div>
            <p className="pcard__desc">{p.description ?? metaLine(p)}</p>
          </Link>
        );
      })}
    </div>
  );
}

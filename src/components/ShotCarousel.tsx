'use client';

import { useEffect, useRef, useState } from 'react';
import type { Img } from '@/data/projects';
import { Frame } from './Frame';

/** A swipeable row of framed screenshots: the next one peeks in, with a "1 / 4" counter and arrows. */
export function ShotCarousel({ items, label, alt }: { items: Img[]; label: string; alt: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const pad2 = (n: number) => String(n).padStart(2, '0');

  const step = () => {
    const el = track.current;
    const slide = el?.firstElementChild as HTMLElement | null;
    return slide ? slide.getBoundingClientRect().width + 12 : 1;
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setI(Math.min(items.length - 1, Math.max(0, Math.round(el.scrollLeft / step()))));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [items.length]);

  const go = (d: number) => track.current?.scrollTo({ left: Math.min(items.length - 1, Math.max(0, i + d)) * step(), behavior: 'smooth' });

  return (
    <section className={`carousel${items.length === 1 ? ' carousel--single' : ''}`} aria-label={label}>
      <div className="carousel__bar">
        <span>{label}</span>
        {items.length > 1 && (
          <span className="carousel__nav">
            <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous image">
              ←
            </button>
            <span>
              {pad2(i + 1)} / {pad2(items.length)}
            </span>
            <button type="button" onClick={() => go(1)} disabled={i === items.length - 1} aria-label="Next image">
              →
            </button>
          </span>
        )}
      </div>
      <div ref={track} className="carousel__track">
        {items.map((img) => (
          <div key={img.src} className="carousel__slide">
            <Frame img={img} alt={alt} sizes="(max-width: 899px) 90vw, 50vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

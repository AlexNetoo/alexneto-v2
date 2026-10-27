'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Img } from '@/data/projects';
import { FullShot } from './FullShot';
import { Reveal } from './Reveal';

/**
 * The stacked project images. Click one to open it full screen, where you can flip through all the images
 * as a carousel (arrow buttons, ← → keys, or a swipe) and close it with the button or Esc.
 */
export function Gallery({ shots, title }: { shots: Img[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const show = (i: number, el: HTMLElement) => {
    opener.current = el;
    setOpen(i);
  };
  const close = useCallback(() => {
    setOpen(null);
    opener.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <div className="project__body">
        {shots.map((img, i) => (
          <Reveal key={img.src} drift delay={i === 0 ? 0.15 : 0}>
            <button type="button" className="shot" onClick={(e) => show(i, e.currentTarget)} aria-label={`Open image ${i + 1} of ${shots.length} full screen`}>
              <FullShot img={img} alt={i === 0 ? `${title} cover` : `${title} screen`} priority={i === 0} />
            </button>
          </Reveal>
        ))}
      </div>
      {open !== null && createPortal(<Lightbox shots={shots} title={title} start={open} onClose={close} />, document.querySelector('.site') ?? document.body)}
    </>
  );
}

function Lightbox({ shots, title, start, onClose }: { shots: Img[]; title: string; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [dir, setDir] = useState(0);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const n = shots.length;

  const go = useCallback(
    (d: number) => {
      if (n < 2) return;
      setDir(d);
      setI((v) => (v + d + n) % n);
    },
    [n],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    const html = document.documentElement;
    const was = html.style.overflow;
    html.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeBtn.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = was;
    };
  }, [go, onClose]);

  const img = shots[i];
  const near = [shots[(i + 1) % n], shots[(i - 1 + n) % n]].filter((s) => s !== img);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, image ${i + 1} of ${n}`}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        if (!t) return;
        const dx = e.changedTouches[0].clientX - t.x;
        const dy = e.changedTouches[0].clientY - t.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="lightbox__bar">
        <span className="lightbox__count" aria-live="polite">
          {i + 1} / {n}
        </span>
        <button ref={closeBtn} type="button" className="lightbox__close" onClick={onClose}>
          close <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="lightbox__stage" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div key={i} className="lightbox__img" data-dir={dir}>
          {img.animated ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.src} alt={`${title} screen ${i + 1}`} />
          ) : (
            <Image src={img.src} alt={`${title} screen ${i + 1}`} width={img.w} height={img.h} quality={82} sizes="100vw" priority />
          )}
        </div>
      </div>

      {n > 1 && (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Previous image">
            ←
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Next image">
            →
          </button>
        </>
      )}
      <div hidden>
        {near.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.src} src={s.src} alt="" />
        ))}
      </div>
    </div>
  );
}

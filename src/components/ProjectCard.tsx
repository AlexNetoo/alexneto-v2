'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Project } from '@/data/projects';
import { LiquidGradientCanvas } from './liquid-index-canvas';

const BLUE: [number, number, number][] = [
  [10, 16, 44],
  [60, 120, 250],
  [150, 190, 255],
];

/**
 * A portrait project card (565 x 748 in the Figma file). The name sits over the image and inverts against it.
 * On hover the card cycles through the project's own images, and a liquid gradient (useLayouts liquid index)
 * washes over it. Rows fade in as they scroll into view.
 */
export function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  const reduce = useReducedMotion();
  const imgs = [p.cover, ...p.gallery.filter((g) => !g.animated).slice(0, 4)];
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const [everHovered, setEverHovered] = useState(false); // mount the WebGL overlay on first hover only

  useEffect(() => {
    if (!hover || reduce) {
      setI(0);
      return;
    }
    const t = setInterval(() => setI((x) => (x + 1) % imgs.length), 950);
    return () => clearInterval(t);
  }, [hover, reduce, imgs.length]);

  const on = () => {
    setHover(true);
    setEverHovered(true);
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.9, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/projects/${p.slug}`}
        className="card"
        aria-label={`${p.title}${p.year ? `, ${p.year}` : ''}`}
        onPointerEnter={on}
        onPointerLeave={() => setHover(false)}
        onFocus={on}
        onBlur={() => setHover(false)}
      >
        <div className="card__zoom">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={i}
              className="card__img"
              initial={{ opacity: i === 0 ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Image
                src={imgs[i].src}
                alt=""
                fill
                priority={index < 3 && i === 0}
                quality={80}
                sizes="(max-width: 599px) 100vw, (max-width: 1000px) 50vw, 33vw"
                style={p.focus ? { objectPosition: p.focus } : undefined}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {everHovered && !reduce && (
          <motion.div className="card__liquid" initial={false} animate={{ opacity: hover ? 0.5 : 0 }} transition={{ duration: 0.6 }} aria-hidden="true">
            <LiquidGradientCanvas colors={BLUE} seed={(index + 2) * 61} idle={!hover} />
          </motion.div>
        )}

        <span className="card__name card__name--diff" aria-hidden="true">
          {p.title}
        </span>
        <span className="card__name card__name--sat" aria-hidden="true">
          {p.title}
        </span>
      </Link>
    </motion.div>
  );
}

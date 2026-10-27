import Image from 'next/image';
import type { Img } from '@/data/projects';

/** A project image: no frame, no backdrop, no cropping (the width comes from .project__body). */
export function FullShot({ img, alt, priority = false }: { img: Img; alt: string; priority?: boolean }) {
  return img.animated ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="fullshot" src={img.src} alt={alt} width={img.w} height={img.h} loading={priority ? 'eager' : 'lazy'} />
  ) : (
    <Image className="fullshot" src={img.src} alt={alt} width={img.w} height={img.h} quality={82} sizes="(max-width: 899px) 94vw, 66vw" priority={priority} />
  );
}

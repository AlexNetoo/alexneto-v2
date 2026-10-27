import Image from 'next/image';
import type { Img } from '@/data/projects';

/** A project image at the full width of the screen: no frame, no backdrop, no cropping. */
export function FullShot({ img, alt, priority = false }: { img: Img; alt: string; priority?: boolean }) {
  return img.animated ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="fullshot" src={img.src} alt={alt} width={img.w} height={img.h} loading={priority ? 'eager' : 'lazy'} />
  ) : (
    <Image className="fullshot" src={img.src} alt={alt} width={img.w} height={img.h} quality={82} sizes="100vw" priority={priority} />
  );
}

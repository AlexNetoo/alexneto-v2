import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { Img } from '@/data/projects';

/** Tiny optimized copy of an image, used for the blurred colour behind a frame. */
export const tint = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=96&q=70`;

/**
 * A screenshot on its own tonal stage: a blurred, saturated copy of the image fills the frame and the sharp
 * image sits on top of it with a soft shadow, so every project gets its own colour without any extra assets.
 */
export function Frame({ img, alt, priority = false, sizes = '(max-width: 899px) 100vw, 60vw' }: { img: Img; alt: string; priority?: boolean; sizes?: string }) {
  return (
    <div className="frame" style={{ ['--bg-img' as string]: `url("${tint(img.src)}")` } as CSSProperties}>
      <span className="frame__bg" aria-hidden="true" />
      <div className="frame__shot">
        {img.animated ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.src} alt={alt} width={img.w} height={img.h} loading={priority ? 'eager' : 'lazy'} />
        ) : (
          <Image src={img.src} alt={alt} width={img.w} height={img.h} quality={82} sizes={sizes} priority={priority} />
        )}
      </div>
    </div>
  );
}

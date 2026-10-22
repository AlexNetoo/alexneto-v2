import { upload } from '@vercel/blob/client';
import type { Img } from '@/data/projects';
import { OWN_PREFIX } from '@/lib/projects-schema';

/** An image in the form: either already stored (src is its URL) or a file waiting to be uploaded. */
export type ImgItem = { key: string; src: string; w: number; h: number; animated?: boolean; file?: File };

export const MAX_UPLOAD_MB = 10;
const MAX_WIDTH = 2400;
const uid = () => Math.random().toString(36).slice(2, 10);

/** Small, cached thumbnail through the site's image optimizer (widths/qualities match next.config). */
export const thumb = (src: string, w = 320) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;

export const fromImg = (img: Img): ImgItem => ({ key: uid(), ...img });

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** Reads the natural size of a file (or a URL) in the browser. */
export async function measureFile(file: File): Promise<{ w: number; h: number }> {
  const bmp = await createImageBitmap(file);
  const size = { w: bmp.width, h: bmp.height };
  bmp.close();
  return size;
}

export function measureUrl(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not load that image.'));
    img.src = url;
  });
}

/** A file picked from disk, ready to preview. Validation errors are thrown with a readable message. */
export async function itemFromFile(file: File): Promise<ImgItem> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error(`${file.name}: use JPG, PNG, WebP or GIF.`);
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`${file.name} is over ${MAX_UPLOAD_MB} MB.`);
  const { w, h } = await measureFile(file);
  return { key: uid(), src: URL.createObjectURL(file), w, h, animated: file.type === 'image/gif', file };
}

export async function itemFromUrl(url: string): Promise<ImgItem> {
  const { w, h } = await measureUrl(url);
  return { key: uid(), src: url, w, h, animated: /\.gif(\?|$)/i.test(url) };
}

const toBlob = (canvas: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));

/** Downscales to 2400px wide and re-encodes (WebP, else JPEG) so pages stay fast. GIFs are kept as they are. */
async function prepare(file: File): Promise<{ blob: Blob; w: number; h: number; ext: string; animated: boolean }> {
  if (file.type === 'image/gif') {
    const { w, h } = await measureFile(file);
    return { blob: file, w, h, ext: 'gif', animated: true };
  }
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bmp.width);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process the image.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const webp = await toBlob(canvas, 'image/webp', 0.88);
  if (webp && webp.type === 'image/webp') return { blob: webp, w, h, ext: 'webp', animated: false };
  const jpg = await toBlob(canvas, 'image/jpeg', 0.88);
  if (!jpg) throw new Error('Your browser could not process the image.');
  return { blob: jpg, w, h, ext: 'jpg', animated: false };
}

/** Uploads a picked file straight to Vercel Blob and returns the stored image. */
export async function uploadItem(item: ImgItem, slug: string): Promise<Img> {
  if (!item.file) return { src: item.src, w: item.w, h: item.h, ...(item.animated ? { animated: true } : {}) };
  const p = await prepare(item.file);
  const base = item.file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';
  const res = await upload(`${OWN_PREFIX}projects/${slug}/${base}.${p.ext}`, p.blob, {
    access: 'public',
    handleUploadUrl: '/api/admin/upload',
    contentType: p.blob.type,
  });
  return { src: res.url, w: p.w, h: p.h, ...(p.animated ? { animated: true } : {}) };
}

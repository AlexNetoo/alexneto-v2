import type { Img, Project } from '@/data/projects';

/**
 * Everything this site writes to Vercel Blob lives under this folder.
 * The store is shared with alexneto.com (same Blob store, so the media library shows its images too), but
 * this test site keeps its own project list and uploads under its own folder: nothing outside it is ever
 * written or deleted, so editing here can never change the live site.
 */
export const OWN_PREFIX = 'alexneto-v2/';

const BLOB_HOST = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/i;
const LOCAL_SRC = /^\/projects\/[A-Za-z0-9._/-]+$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isBlobUrl = (src: string) => {
  try {
    const u = new URL(src);
    return u.protocol === 'https:' && BLOB_HOST.test(u.hostname);
  } catch {
    return false;
  }
};

/** True for images this site uploaded itself (safe to delete). */
export const isOwnBlob = (src: string) => {
  if (!isBlobUrl(src)) return false;
  try {
    return decodeURIComponent(new URL(src).pathname).startsWith(`/${OWN_PREFIX}`);
  } catch {
    return false;
  }
};

const text = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim().replace(/\s+/g, ' ');
  return t ? t.slice(0, max) : undefined;
};

const dim = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 20000 ? Math.round(v) : null);

function parseImg(raw: unknown): Img | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const src = typeof r.src === 'string' ? r.src : '';
  if (!(LOCAL_SRC.test(src) || isBlobUrl(src)) || src.length > 600) return null;
  const w = dim(r.w);
  const h = dim(r.h);
  if (!w || !h) return null;
  return { src, w, h, ...(r.animated === true ? { animated: true } : {}) };
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseProject(raw: unknown): Parsed<Project> {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid project.' };
  const r = raw as Record<string, unknown>;
  const title = text(r.title, 100);
  if (!title) return { ok: false, error: 'Every project needs a title.' };
  const slug = typeof r.slug === 'string' ? r.slug.trim().toLowerCase() : '';
  if (!SLUG_RE.test(slug) || slug.length > 60) return { ok: false, error: `“${title}”: the slug can only use lowercase letters, numbers and dashes.` };
  const cover = parseImg(r.cover);
  if (!cover) return { ok: false, error: `“${title}”: the cover image is missing or invalid.` };
  const galleryRaw = Array.isArray(r.gallery) ? r.gallery : [];
  if (galleryRaw.length > 30) return { ok: false, error: `“${title}”: too many images (max 30).` };
  const gallery: Img[] = [];
  for (const g of galleryRaw) {
    const img = parseImg(g);
    if (!img) return { ok: false, error: `“${title}”: one of the images is invalid.` };
    gallery.push(img);
  }
  let link = text(r.link, 300);
  if (link) {
    try {
      const u = new URL(link);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
      link = u.toString();
    } catch {
      return { ok: false, error: `“${title}”: the project link must start with http:// or https://.` };
    }
  }
  const focus = text(r.focus, 30);
  const project: Project = {
    slug,
    title,
    ...(text(r.year, 12) ? { year: text(r.year, 12) } : {}),
    ...(text(r.scope, 100) ? { scope: text(r.scope, 100) } : {}),
    ...(text(r.industry, 100) ? { industry: text(r.industry, 100) } : {}),
    ...(text(r.description, 600) ? { description: text(r.description, 600) } : {}),
    ...(link ? { link } : {}),
    ...(focus && /^[0-9.% ]+$/.test(focus) ? { focus } : {}),
    featured: r.featured === true,
    cover,
    gallery,
  };
  return { ok: true, value: project };
}

/** Strict: the first problem fails the whole list. Slugs must be unique. */
export function parseProjects(raw: unknown): Parsed<Project[]> {
  if (!Array.isArray(raw)) return { ok: false, error: 'Invalid project list.' };
  if (raw.length > 200) return { ok: false, error: 'Too many projects.' };
  const out: Project[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const p = parseProject(item);
    if (!p.ok) return p;
    if (seen.has(p.value.slug)) return { ok: false, error: `Two projects use the slug “${p.value.slug}”.` };
    seen.add(p.value.slug);
    out.push(p.value);
  }
  return { ok: true, value: out };
}

/** Lenient: used when reading what is stored, so one bad entry cannot take the site down. */
export function parseStored(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return [];
  const out: Project[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const p = parseProject(item);
    if (p.ok && !seen.has(p.value.slug)) {
      seen.add(p.value.slug);
      out.push(p.value);
    }
  }
  return out;
}

export const imageUrls = (list: Project[]) => list.flatMap((p) => [p.cover.src, ...p.gallery.map((g) => g.src)]);

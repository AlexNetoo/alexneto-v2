import snapshot from './projects.snapshot.json';

export type Img = { src: string; w: number; h: number; animated?: boolean };

export type Project = {
  slug: string;
  title: string;
  year?: string;
  /** CSS object-position for the cover when it is cropped (cards). */
  focus?: string;
  scope?: string;
  industry?: string;
  link?: string;
  featured?: boolean;
  cover: Img;
  gallery: Img[];
};

/**
 * The starting list: the live alexneto.com projects, copied once (src/data/projects.snapshot.json).
 * Once the admin (/admin) saves, the list kept in Vercel Blob takes over (see src/lib/projects-store.ts).
 * Images are the same Vercel Blob files as alexneto.com.
 */
export const SEED_PROJECTS = snapshot as Project[];

export const categoryOf = (p: Project) => p.scope ?? (p.link ? 'Live site' : 'Case study');
export const metaLine = (p: Project) => [categoryOf(p), p.year].filter(Boolean).join(' · ');
export const linkHost = (p: Project) => {
  try {
    return p.link ? new URL(p.link).host.replace(/^www\./, '') : undefined;
  } catch {
    return p.link;
  }
};
export const nextProject = (list: Project[], slug: string) => {
  const i = list.findIndex((p) => p.slug === slug);
  return list[(i + 1) % list.length];
};

/** The `count` projects after `slug`, wrapping around (for "more projects"). */
export const moreProjects = (list: Project[], slug: string, count = 2) => {
  const i = list.findIndex((p) => p.slug === slug);
  return Array.from({ length: Math.min(count, list.length - 1) }, (_, k) => list[(i + 1 + k) % list.length]);
};

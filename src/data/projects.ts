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
 * The live alexneto.com project list, copied once (src/data/projects.snapshot.json) so this test site
 * runs without any of the live site's storage or keys. Images are the same Vercel Blob files.
 */
export const projects = snapshot as Project[];

export const categoryOf = (p: Project) => p.scope ?? (p.link ? 'Live site' : 'Case study');
export const metaLine = (p: Project) => [categoryOf(p), p.year].filter(Boolean).join(' · ');
export const linkHost = (p: Project) => {
  try {
    return p.link ? new URL(p.link).host.replace(/^www\./, '') : undefined;
  } catch {
    return p.link;
  }
};
export const nextProject = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};

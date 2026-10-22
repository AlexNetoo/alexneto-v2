import { del, list, put } from '@vercel/blob';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { SEED_PROJECTS, type Project } from '@/data/projects';
import { OWN_PREFIX, imageUrls, isOwnBlob, parseStored } from './projects-schema';

/**
 * Where projects live. The built-in list (src/data/projects.ts) is the starting point; once the
 * admin saves, a versioned JSON document in Vercel Blob becomes the source of truth. Older
 * versions are kept (last few) so a bad save can be rolled back by hand.
 */
const DOC_PREFIX = `${OWN_PREFIX}content/projects-`;
const KEEP_VERSIONS = 5;

/** The store is shared with alexneto.com, so it is connected under its own env prefix. */
export const blobToken = () => process.env.ALEXNETO_COM_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

const versionOf = (pathname: string) => Number(pathname.match(/projects-(\d+)\.json$/)?.[1] ?? 0);

async function readDoc(): Promise<Project[] | null> {
  const token = blobToken();
  if (!token) return null;
  const { blobs } = await list({ prefix: DOC_PREFIX, token, limit: 100 });
  if (!blobs.length) return null;
  const latest = blobs.reduce((a, b) => (versionOf(b.pathname) > versionOf(a.pathname) ? b : a));
  // every version has its own URL, so this can never be a stale CDN copy
  const res = await fetch(latest.url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not read ${latest.pathname} (${res.status})`);
  const json = (await res.json()) as { projects?: unknown };
  return parseStored(json.projects);
}

const readDocCached = unstable_cache(readDoc, ['projects-doc-v1'], { tags: ['projects'] });

/** Projects for the public site: cached, refreshed when the admin saves. Falls back to the built-in list. */
export async function getProjects(): Promise<Project[]> {
  try {
    return (await readDocCached()) ?? SEED_PROJECTS;
  } catch (e) {
    console.error('[projects] falling back to built-in list:', e);
    return SEED_PROJECTS;
  }
}

/** Uncached read for the admin. Throws if storage is configured but unreachable. */
export async function getProjectsFresh(): Promise<Project[]> {
  return (await readDoc()) ?? SEED_PROJECTS;
}

export async function saveProjects(next: Project[], prev: Project[]) {
  const token = blobToken();
  if (!token) throw new Error('Storage is not configured (missing Blob token).');

  await put(`${DOC_PREFIX}${Date.now()}.json`, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), projects: next }), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  });

  // housekeeping must never turn a successful save into an error
  try {
    const { blobs } = await list({ prefix: DOC_PREFIX, token, limit: 100 });
    const old = blobs.sort((a, b) => versionOf(b.pathname) - versionOf(a.pathname)).slice(KEEP_VERSIONS);
    if (old.length) await del(old.map((b) => b.url), { token });

    const keep = new Set(imageUrls(next));
    const orphans = [...new Set(imageUrls(prev))].filter((u) => !keep.has(u) && isOwnBlob(u));
    if (orphans.length) await del(orphans, { token });
  } catch (e) {
    console.error('[projects] cleanup failed:', e);
  }

  revalidateTag('projects');
  revalidatePath('/', 'layout');
}

export type LibraryItem = { url: string; name: string; size: number; uploadedAt: string };

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

/** Every image in the store (including the ones from the previous site), newest first, duplicates collapsed. */
export async function listLibrary(): Promise<LibraryItem[]> {
  const token = blobToken();
  if (!token) return [];
  const all: { url: string; pathname: string; size: number; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ token, cursor, limit: 1000 });
    all.push(...page.blobs);
    cursor = page.cursor;
  } while (cursor && all.length < 3000);

  const items = all
    .filter((b) => IMAGE_EXT.test(b.pathname))
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));

  // the old site re-uploaded the same file many times: keep the newest of each (same name + size)
  const seen = new Set<string>();
  const out: LibraryItem[] = [];
  for (const b of items) {
    const file = b.pathname.split('/').pop() ?? b.pathname;
    const base = file.replace(/^\d{10,}-/, '').replace(/-[A-Za-z0-9]{28,32}(?=\.[a-z0-9]+$)/i, '');
    const key = `${base.toLowerCase()}|${b.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ url: b.url, name: base, size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString() });
  }
  return out;
}

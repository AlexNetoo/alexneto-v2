import { guard, json } from '@/lib/admin-auth';
import { parseProjects } from '@/lib/projects-schema';
import { blobToken, getProjectsFresh, saveProjects } from '@/lib/projects-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    return json({ projects: await getProjectsFresh() }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Could not load projects.' }, 500);
  }
}

/** Replaces the whole project list (add, edit, delete, reorder and feature all go through here). */
export async function PUT(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  if (!blobToken()) return json({ error: 'Storage is not configured on the server.' }, 503);

  let body: { projects?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }
  const parsed = parseProjects(body.projects);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  try {
    const prev = await getProjectsFresh();
    await saveProjects(parsed.value, prev);
    return json({ projects: parsed.value }, 200);
  } catch (e) {
    console.error('[admin] save failed', e);
    return json({ error: e instanceof Error ? e.message : 'Could not save.' }, 500);
  }
}

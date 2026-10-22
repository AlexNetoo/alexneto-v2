import { guard, json } from '@/lib/admin-auth';
import { listLibrary } from '@/lib/projects-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    return json({ items: await listLibrary() }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Could not load the library.' }, 500);
  }
}

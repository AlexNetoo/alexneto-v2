import { COOKIE, json } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = json({ ok: true }, 200);
  res.headers.append('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return res;
}

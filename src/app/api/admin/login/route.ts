import { COOKIE, SESSION_SECONDS, adminConfigured, checkPassword, createSessionValue, json } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Best-effort throttle (per server instance): 6 wrong attempts per IP per 10 minutes. */
const fails = new Map<string, { n: number; until: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX_FAILS = 6;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  if (!adminConfigured()) return json({ error: 'The admin password is not configured on the server.' }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && rec.until > now && rec.n >= MAX_FAILS) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429);

  let password = '';
  try {
    password = String(((await request.json()) as { password?: unknown }).password ?? '');
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }

  if (!checkPassword(password)) {
    const next = rec && rec.until > now ? { n: rec.n + 1, until: rec.until } : { n: 1, until: now + WINDOW };
    fails.set(ip, next);
    await sleep(700);
    return json({ error: 'Wrong password.' }, 401);
  }

  fails.delete(ip);
  const res = json({ ok: true }, 200);
  res.headers.append(
    'Set-Cookie',
    `${COOKIE}=${createSessionValue()}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  );
  return res;
}

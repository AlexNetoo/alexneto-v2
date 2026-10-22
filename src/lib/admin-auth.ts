import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Single-password admin. The password lives in the ADMIN_PASSWORD env var (Vercel), never in the repo.
 * A successful login sets a signed, expiring, httpOnly cookie; changing the password logs everyone out.
 */
export const COOKIE = 'admin_session';
export const SESSION_SECONDS = 60 * 60 * 24 * 7;

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

const secret = () => process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';

const mac = (key: string, data: string) => createHmac('sha256', key).update(data).digest();

const sign = (exp: number) => mac(secret(), `admin.${exp}`).toString('base64url');

/** Constant-time comparison (both sides are hashed first so lengths always match). */
export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(mac('pw', input), mac('pw', expected));
}

export function createSessionValue() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `${exp}.${sign(exp)}`;
}

export function verifySessionValue(value: string | undefined): boolean {
  if (!value || !adminConfigured()) return false;
  const [expRaw, sig] = value.split('.');
  const exp = Number(expRaw);
  if (!sig || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin() {
  return verifySessionValue((await cookies()).get(COOKIE)?.value);
}

const json = (body: unknown, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Guard for admin API routes. Returns a Response to send back when the request must be refused,
 * or null when it may proceed. Also rejects cross-site requests.
 */
export async function guard(request: Request): Promise<Response | null> {
  const origin = request.headers.get('origin');
  if (origin) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    try {
      if (new URL(origin).host !== host) return json({ error: 'Cross-site request blocked.' }, 403);
    } catch {
      return json({ error: 'Bad origin.' }, 403);
    }
  }
  if (!(await isAdmin())) return json({ error: 'Not signed in.' }, 401);
  return null;
}

export { json };

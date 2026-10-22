import { guard, json } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reads Vercel's Web Analytics data for this project (visits/count + visits/aggregate) and hands
 * a trimmed shape to the admin's Analytics tab. Needs a Vercel access token with Web Analytics
 * read access, stored as VERCEL_TOKEN — never shipped to the browser. Project/team IDs aren't
 * secret, so they're just constants (overridable via env if the project ever moves).
 * https://vercel.com/docs/analytics/web-analytics-api
 */
const PROJECT_ID = process.env.VERCEL_ANALYTICS_PROJECT_ID || 'prj_Z35VY6HPwhyHGrjihxt63wfxLcRQ';
const TEAM_ID = process.env.VERCEL_ANALYTICS_TEAM_ID || 'team_vUMYIU2L2X1nkwZxWFrAKxKa';

const RANGES = {
  '24h': { hours: 24, granularity: 'hour' },
  '7d': { hours: 24 * 7, granularity: 'day' },
  '30d': { hours: 24 * 30, granularity: 'day' },
} as const;
type RangeKey = keyof typeof RANGES;

type Totals = { pageviews: number; visitors: number };
type SeriesRow = { timestamp: string; pageviews: number; visitors: number };
type DimRow = Record<string, unknown> & { pageviews: number; visitors: number };

async function vercel<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('missing-token');
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${path}`);
  url.searchParams.set('teamId', TEAM_ID);
  url.searchParams.set('projectId', PROJECT_ID);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Vercel API ${path} responded ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }
  const data = (await res.json()) as { data: T };
  return data.data;
}

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;

  if (!process.env.VERCEL_TOKEN) return json({ configured: false }, 200);

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range');
  const range: RangeKey = rangeParam && rangeParam in RANGES ? (rangeParam as RangeKey) : '7d';
  const { hours, granularity } = RANGES[range];
  const until = new Date();
  const since = new Date(until.getTime() - hours * 60 * 60 * 1000);
  const sinceIso = since.toISOString();
  const untilIso = until.toISOString();

  try {
    const [totals, series, pages, referrers, countries, devices, browsers, os] = await Promise.all([
      vercel<Totals>('visits/count', { since: sinceIso, until: untilIso }),
      vercel<SeriesRow[]>('visits/aggregate', { since: sinceIso, until: untilIso, by: granularity }),
      vercel<DimRow[]>('visits/aggregate', { since: sinceIso, until: untilIso, by: 'requestPath', limit: '8' }),
      vercel<DimRow[]>('visits/aggregate', { since: sinceIso, until: untilIso, by: 'referrerHostname', limit: '8' }),
      vercel<DimRow[]>('visits/aggregate', { since: sinceIso, until: untilIso, by: 'country', limit: '6' }),
      vercel<DimRow[]>('visits/aggregate', { since: sinceIso, until: untilIso, by: 'deviceType', limit: '6' }),
      vercel<DimRow[]>('visits/aggregate', { since: sinceIso, until: untilIso, by: 'browserName', limit: '6' }),
      vercel<DimRow[]>('visits/aggregate', { since: sinceIso, until: untilIso, by: 'osName', limit: '6' }),
    ]);
    return json({ configured: true, range, totals, series, pages, referrers, countries, devices, browsers, os }, 200);
  } catch (e) {
    if (e instanceof Error && e.message === 'missing-token') return json({ configured: false }, 200);
    console.error('[admin/analytics]', e);
    return json({ configured: true, error: e instanceof Error ? e.message : 'Could not load analytics.' }, 502);
  }
}

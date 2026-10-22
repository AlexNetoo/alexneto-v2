'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertBanner, Caption, Card, Heading, SegmentedControl, Skeleton, Stat, Tabs } from '@/halaska-kit';

type RangeKey = '24h' | '7d' | '30d';
type Totals = { pageviews: number; visitors: number };
type SeriesRow = { timestamp: string; pageviews: number; visitors: number };
type DimRow = Record<string, unknown> & { pageviews: number; visitors: number };
type Loaded = {
  configured: true;
  range: RangeKey;
  totals: Totals;
  series: SeriesRow[];
  pages: DimRow[];
  referrers: DimRow[];
  countries: DimRow[];
  devices: DimRow[];
  browsers: DimRow[];
  os: DimRow[];
};
type Data = Loaded | { configured: false } | { configured: true; error: string };

const RANGE_LABEL: Record<RangeKey, string> = { '24h': 'Last 24 Hours', '7d': 'Last 7 Days', '30d': 'Last 30 Days' };
const numberFmt = new Intl.NumberFormat('en-US');

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleDateString('en-US', { weekday: 'short' })}`;
}

function formatTick(iso: string, range: RangeKey) {
  const d = new Date(iso);
  return range === '24h' ? d.toLocaleTimeString('en-US', { hour: 'numeric' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatHover(iso: string, range: RangeKey) {
  const d = new Date(iso);
  return range === '24h' ? d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }) : dayLabel(iso);
}

/** Minimalist area chart, in the site's own style — no chart library. Hover shows a crosshair + tooltip. */
function VisitorsChart({ series, range }: { series: SeriesRow[]; range: RangeKey }) {
  const W = 960;
  const H = 220;
  const PAD = 8;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (series.length < 2) return <div className="adm-an-chart adm-an-chart--empty">Not enough data yet for this range.</div>;

  const max = Math.max(1, ...series.map((s) => s.visitors));
  const x = (i: number) => (i / (series.length - 1)) * (W - PAD * 2) + PAD;
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const line = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(s.visitors).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(series.length - 1).toFixed(1)},${H} L ${x(0).toFixed(1)},${H} Z`;
  const ticks = [0, Math.floor((series.length - 1) / 2), series.length - 1];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < series.length; i++) {
      const d = Math.abs(x(i) - relX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setHover(nearest);
  };

  const point = hover !== null ? series[hover] : null;
  const pointPct = hover !== null ? (x(hover) / W) * 100 : 0;
  const tooltipRight = pointPct > 62;

  return (
    <div className="adm-an-chart" ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="adm-an-chart__svg">
        <path d={area} className="adm-an-chart__area" />
        <path d={line} className="adm-an-chart__line" />
        {point && (
          <>
            <line x1={x(hover!)} y1={0} x2={x(hover!)} y2={H} className="adm-an-chart__crosshair" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover!)} cy={y(point.visitors)} r={4.5} className="adm-an-chart__dot" />
          </>
        )}
      </svg>
      {point && (
        <div className="adm-an-chart__tip" style={{ left: `${pointPct}%`, ...(tooltipRight ? { transform: 'translateX(-100%)' } : {}) }}>
          <span className="adm-an-chart__tip-row">
            <i /> Visitors <b>{numberFmt.format(point.visitors)}</b>
          </span>
          <span className="adm-an-chart__tip-date">{formatHover(point.timestamp, range)}</span>
        </div>
      )}
      <div className="adm-an-chart__ticks">
        {ticks.map((i) => (
          <span key={i}>{formatTick(series[i].timestamp, range)}</span>
        ))}
      </div>
    </div>
  );
}

function List({ title, rows, valueKey, empty }: { title: string; rows: DimRow[]; valueKey: string; empty: string }) {
  return (
    <div className="adm-an-panel">
      <div className="adm-an-panel__head">
        <span>{title}</span>
        <span>Visitors</span>
      </div>
      {rows.length === 0 && (
        <p style={{ padding: '14px 0' }}>
          <Caption>{empty}</Caption>
        </p>
      )}
      <ul className="adm-an-panel__list">
        {rows.map((r, i) => {
          const raw = r[valueKey];
          const label = typeof raw === 'string' && raw ? raw : valueKey === 'referrerHostname' ? 'Direct / none' : '(unknown)';
          return (
            <li key={i}>
              <span className="adm-an-panel__label" title={label}>
                {label}
              </span>
              <span className="adm-an-panel__value">{numberFmt.format(r.visitors)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** ISO 3166-1 alpha-2 → flag emoji, algorithmically (no lookup table needed). */
function flag(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

const COUNTRY_NAMES = typeof Intl.DisplayNames !== 'undefined' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

/** Vercel's `country` dimension is usually an ISO region code, but Intl.DisplayNames throws on
 * anything it doesn't recognize (e.g. a non-standard or empty value) — fall back to the raw code. */
function countryName(code: string) {
  try {
    return (COUNTRY_NAMES && code && COUNTRY_NAMES.of(code)) || code || '(unknown)';
  } catch {
    return code || '(unknown)';
  }
}

/** Share panel: rows with a proportional bar behind the label, like Vercel's Countries/Devices/OS cards. */
function SharePanel({
  tabs,
  totalVisitors,
  empty,
  isCountry,
}: {
  tabs: { label: string; rows: DimRow[]; valueKey: string }[];
  totalVisitors: number;
  empty: string;
  isCountry?: boolean;
}) {
  const [active, setActive] = useState(0);
  const { rows, valueKey } = tabs[active];
  const max = Math.max(1, ...rows.map((r) => r.visitors));
  return (
    <div className="adm-an-panel">
      <div className="adm-an-panel__head">
        {tabs.length > 1 ? (
          <Tabs tabs={tabs.map((t) => t.label)} value={tabs[active].label} onChange={(l: string) => setActive(Math.max(0, tabs.findIndex((t) => t.label === l)))} />
        ) : (
          <span>{tabs[0].label}</span>
        )}
        <span>Visitors</span>
      </div>
      {rows.length === 0 && (
        <p style={{ padding: '14px 0' }}>
          <Caption>{empty}</Caption>
        </p>
      )}
      <ul className="adm-an-panel__list adm-an-panel__list--bars">
        {rows.map((r, i) => {
          const raw = r[valueKey];
          const code = typeof raw === 'string' ? raw : '';
          const label = isCountry ? countryName(code) : code || '(unknown)';
          const pct = totalVisitors ? Math.round((r.visitors / totalVisitors) * 100) : 0;
          return (
            <li key={i} className="adm-an-bar-row">
              <span className="adm-an-bar-row__bar" style={{ width: `${Math.max(2, (r.visitors / max) * 100)}%` }} />
              <span className="adm-an-panel__label adm-an-bar-row__label" title={label}>
                {isCountry && <span aria-hidden="true">{flag(code)}</span>} {label}
              </span>
              <span className="adm-an-panel__value">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AdminAnalytics() {
  const [range, setRange] = useState<RangeKey>('7d');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let live = true;
    setLoading(true);
    setFetchError('');
    fetch(`/api/admin/analytics?range=${range}`)
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as Data | { error?: string };
        if (!r.ok && !('configured' in d)) throw new Error((d as { error?: string }).error || 'Could not load analytics.');
        if (live) setData(d as Data);
      })
      .catch((e) => live && setFetchError(e instanceof Error ? e.message : 'Could not load analytics.'))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [range]);

  const rangeSwitch = (
    <SegmentedControl
      options={Object.values(RANGE_LABEL)}
      value={RANGE_LABEL[range]}
      onChange={(label: string) => setRange((Object.keys(RANGE_LABEL) as RangeKey[]).find((k) => RANGE_LABEL[k] === label) ?? '7d')}
    />
  );

  if (loading && !data) {
    return (
      <Card>
        <div className="adm-row adm-row--between">
          <Heading level={4}>Analytics</Heading>
          {rangeSwitch}
        </div>
        <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          <Skeleton height={56} />
          <Skeleton height={220} />
        </div>
      </Card>
    );
  }

  if (fetchError || (data && 'error' in data)) {
    return (
      <Card>
        <div className="adm-row adm-row--between" style={{ marginBottom: 20 }}>
          <Heading level={4}>Analytics</Heading>
          {rangeSwitch}
        </div>
        <AlertBanner variant="danger" description={fetchError || (data && 'error' in data ? data.error : 'Could not load analytics.')} />
      </Card>
    );
  }

  if (data && !data.configured) {
    return (
      <Card>
        <Heading level={4}>Analytics</Heading>
        <p style={{ marginTop: 12, maxWidth: 560, fontSize: 14, opacity: 0.7 }}>
          Not connected yet. Web Analytics is already collecting data on the live site, but this tab needs a Vercel access token to read it back here.
        </p>
        <ol style={{ marginTop: 12, maxWidth: 560, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 13, opacity: 0.7, listStyle: 'decimal' }}>
          <li>
            Create a token at{' '}
            <a className="adm-link" href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer">
              vercel.com/account/tokens
            </a>{' '}
            (scope it to this project if that option is offered).
          </li>
          <li>Add it to the project as an environment variable named exactly VERCEL_TOKEN, type Secret.</li>
          <li>Redeploy, and this tab will pick it up automatically.</li>
        </ol>
      </Card>
    );
  }

  if (!data || !data.configured || 'error' in data) return null;

  const avgPerVisitor = data.totals.visitors ? (data.totals.pageviews / data.totals.visitors).toFixed(1) : '0';

  return (
    <Card>
      <div className="adm-row adm-row--between">
        <Heading level={4}>Analytics</Heading>
        {rangeSwitch}
      </div>

      <div className="adm-an-stats">
        <Stat label="Visitors" value={numberFmt.format(data.totals.visitors)} />
        <Stat label="Page Views" value={numberFmt.format(data.totals.pageviews)} />
        <Stat label="Pages / Visitor" value={avgPerVisitor} />
      </div>

      <VisitorsChart series={data.series} range={data.range} />

      <div className="adm-an-panels">
        <List title="Pages" rows={data.pages} valueKey="requestPath" empty="No page views in this range yet." />
        <List title="Referrers" rows={data.referrers} valueKey="referrerHostname" empty="No referrer traffic in this range yet." />
      </div>

      <div className="adm-an-panels adm-an-panels--three">
        <SharePanel tabs={[{ label: 'Countries', rows: data.countries, valueKey: 'country' }]} totalVisitors={data.totals.visitors} empty="No location data yet." isCountry />
        <SharePanel
          tabs={[
            { label: 'Devices', rows: data.devices, valueKey: 'deviceType' },
            { label: 'Browsers', rows: data.browsers, valueKey: 'browserName' },
          ]}
          totalVisitors={data.totals.visitors}
          empty="No device data yet."
        />
        <SharePanel tabs={[{ label: 'Operating Systems', rows: data.os, valueKey: 'osName' }]} totalVisitors={data.totals.visitors} empty="No OS data yet." />
      </div>
    </Card>
  );
}

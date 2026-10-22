'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertBanner, Button, Caption, Heading, Skeleton, TextInput, useModalFocus } from '@/halaska-kit';

type Item = { url: string; name: string; size: number; uploadedAt: string };

const kb = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`);

/** Picker for images that already live in the Blob store (uploads from this admin and the previous site). */
export function MediaLibrary({
  multiple,
  onClose,
  onPick,
}: {
  multiple: boolean;
  onClose: () => void;
  onPick: (urls: string[]) => void;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    fetch('/api/admin/library')
      .then(async (r) => {
        const d = (await r.json()) as { items?: Item[]; error?: string };
        if (!r.ok) throw new Error(d.error || 'Could not load the library.');
        if (live) setItems(d.items ?? []);
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Could not load the library.'));
    return () => {
      live = false;
    };
  }, []);

  const panelRef = (useModalFocus as unknown as (open: boolean, onClose: () => void) => React.RefObject<HTMLDivElement>)(true, onClose);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (items ?? []).filter((i) => !t || i.name.toLowerCase().includes(t));
  }, [items, q]);

  const toggle = (url: string) => {
    if (!multiple) return onPick([url]);
    setPicked((p) => (p.includes(url) ? p.filter((u) => u !== url) : [...p, url]));
  };

  return (
    <div className="adm-modal" onClick={onClose}>
      <div ref={panelRef} className="adm-modal__panel" role="dialog" aria-modal="true" aria-label="Media library" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="adm-row adm-row--between" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <Heading level={4}>Media library</Heading>
            <Caption>
              Images already in your Blob store{items ? `, ${items.length} unique files` : ''}. {multiple ? 'Select one or more.' : 'Click one to use it.'}
            </Caption>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <TextInput type="search" placeholder="Search by file name…" value={q} onChange={setQ} aria-label="Search by file name" />
        <div className="adm-lib" data-lenis-prevent>
          {error && (
            <div style={{ gridColumn: '1 / -1' }}>
              <AlertBanner variant="danger" description={error} />
            </div>
          )}
          {!items && !error && Array.from({ length: 12 }, (_, k) => <Skeleton key={k} height={150} />)}
          {items && shown.length === 0 && (
            <p style={{ gridColumn: '1 / -1' }}>
              <Caption>No images found.</Caption>
            </p>
          )}
          {shown.map((i) => {
            const on = picked.includes(i.url);
            return (
              <button key={i.url} type="button" className={`adm-lib__item${on ? ' is-on' : ''}`} onClick={() => toggle(i.url)} title={i.name} aria-pressed={multiple ? on : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url} alt="" loading="lazy" decoding="async" />
                <span className="adm-lib__name">{i.name}</span>
                <span className="adm-lib__size">{kb(i.size)}</span>
                {on && <span className="adm-lib__check">✓</span>}
              </button>
            );
          })}
        </div>
        {multiple && (
          <div className="adm-row adm-row--between">
            <Caption>{picked.length} selected</Caption>
            <Button type="button" disabled={!picked.length} onClick={() => onPick(picked)}>
              {`Add ${picked.length || ''} image${picked.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

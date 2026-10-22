'use client';

import { AlertBanner, Card, Heading } from '@/halaska-kit';

/** Centered card used by the server page for "not configured" / "could not load" states. */
export function AdminMessage({ text, error }: { text: string; error?: boolean }) {
  return (
    <div className="adm-center">
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <Heading level={3}>Admin</Heading>
          {error ? <AlertBanner variant="danger" description={text} /> : <p style={{ fontSize: 14, opacity: 0.7 }}>{text}</p>}
        </div>
      </Card>
    </div>
  );
}

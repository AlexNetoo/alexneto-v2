'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AlertBanner, Button, Card, Heading, TextInput } from '@/halaska-kit';

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => form.current?.querySelector('input')?.focus(), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not sign in.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setBusy(false);
    }
  };

  return (
    <div className="adm-center">
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <form ref={form} onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <Heading level={3}>Admin</Heading>
            <p style={{ fontSize: 13, opacity: 0.6 }}>Enter the password to manage projects.</p>
          </div>
          <TextInput label="Password" type="password" value={password} onChange={setPassword} aria-label="Password" />
          {error && <AlertBanner variant="danger" description={error} />}
          <Button type="submit" fullWidth loading={busy} disabled={!password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <a className="adm-link" href="/" style={{ fontSize: 13, textAlign: 'center', opacity: 0.7 }}>
            ← Back to website
          </a>
        </form>
      </Card>
    </div>
  );
}

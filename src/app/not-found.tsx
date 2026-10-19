import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="hero">
      <div style={{ display: 'grid', gap: 24, justifyItems: 'center' }}>
        <h1 className="statement">This page doesn’t exist.</h1>
        <Link className="btn" href="/">
          Back home
        </Link>
      </div>
    </section>
  );
}

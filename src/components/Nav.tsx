'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { whatsappUrl } from '@/data/site';
import { ThemeDot } from './ThemeDot';

const ITEMS = [
  { label: 'home', href: '/' },
  { label: 'projects', href: '/projects' },
  { label: 'about', href: '/about' },
] as const;

/** Small centred monospace nav. The current page is bold white, the rest are quiet. */
export function Nav() {
  const path = usePathname();
  const current = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));
  return (
    <header className="nav">
      <nav aria-label="Primary" style={{ display: 'contents' }}>
        {ITEMS.map((i) => (
          <Link key={i.href} href={i.href} aria-current={current(i.href) ? 'page' : undefined}>
            {i.label}
          </Link>
        ))}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          contact ↗
        </a>
        <ThemeDot />
      </nav>
    </header>
  );
}

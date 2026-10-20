'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site, whatsappUrl } from '@/data/site';
import { ThemeToggle } from './ThemeToggle';

/** Fixed top bar from the Figma file: avatar on the left, About and Contact pills on the right. */
export function Nav() {
  const pathname = usePathname();
  return (
    <header className="nav">
      <Link href="/" className="avatar" aria-label={`${site.name}, home`}>
        <Image src="/avatar.png" alt="" width={80} height={80} priority />
      </Link>
      <nav className="nav__links" aria-label="Primary">
        <Link href="/about" className="pill" aria-current={pathname === '/about' ? 'page' : undefined}>
          About
        </Link>
        <a href={whatsappUrl} className="pill" target="_blank" rel="noopener noreferrer">
          Contact
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site, whatsappUrl } from '@/data/site';
import { GooeyNavbar, type NavItem } from './gooey-navbar';
import { ThemeIcons, useThemeToggle } from './ThemeToggle';

/**
 * Fixed top bar from the Figma file: avatar on the left, then About, Contact and the dark mode switch as one
 * grey gooey strip (useLayouts gooey navbar): hover a pill and its neighbours slide apart, joined by a liquid neck.
 */
export function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useThemeToggle();
  const items: NavItem[] = [
    { label: 'About', link: '/about', width: 68 },
    { label: 'Contact', link: whatsappUrl, width: 80 },
    { label: 'Dark mode', content: <ThemeIcons />, ariaLabel: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', onPress: toggle, width: 40 },
  ];
  return (
    <header className="nav">
      <Link href="/" className="avatar" aria-label={`${site.name}, home`}>
        <Image src="/avatar.png" alt="" width={80} height={80} priority />
      </Link>
      <GooeyNavbar items={items} activeIndex={pathname === '/about' ? 0 : -1} defaultActiveIndex={-1} />
    </header>
  );
}

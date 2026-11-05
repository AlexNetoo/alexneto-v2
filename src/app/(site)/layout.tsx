import type { Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { Cursor } from '@/components/Cursor';
import { DotField } from '@/components/DotField';
import { Nav } from '@/components/Nav';
import { SoundToggle } from '@/components/SoundToggle';
import '../site.css';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400'], variable: '--font-dm-sans', display: 'swap' });

export const viewport: Viewport = { themeColor: '#ffffff', colorScheme: 'light' };

/** The public site: white and grays from the design system, a top-right disclosure menu, light only. The admin lives outside this group. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site ${dmSans.variable}`}>
      <DotField />
      <Nav />
      <Cursor />
      <SoundToggle />
      <main id="main">{children}</main>
      <noscript>
        <style>{'.site .reveal{opacity:1!important;transform:none!important}'}</style>
      </noscript>
    </div>
  );
}

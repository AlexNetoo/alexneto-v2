import type { Viewport } from 'next';
import { Nav } from '@/components/Nav';
import { SoundToggle } from '@/components/SoundToggle';
import '../site.css';

export const viewport: Viewport = { themeColor: '#f3f0ea', colorScheme: 'light' };

/** The public site: a centred monospace nav on warm paper, light only. The admin lives outside this group. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <Nav />
      <SoundToggle />
      <main>{children}</main>
      <noscript>
        <style>{'.site .reveal{opacity:1!important;transform:none!important}'}</style>
      </noscript>
    </div>
  );
}

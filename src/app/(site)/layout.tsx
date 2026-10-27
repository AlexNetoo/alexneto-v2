import { Nav } from '@/components/Nav';
import { SoundToggle } from '@/components/SoundToggle';
import '../site.css';

/** The public site: a centred monospace nav and a warm near-black page. The admin lives outside this group. */
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

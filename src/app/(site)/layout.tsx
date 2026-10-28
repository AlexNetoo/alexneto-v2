import { Nav } from '@/components/Nav';
import { SoundToggle } from '@/components/SoundToggle';
import '../site.css';

/** The public site: a centred monospace nav and a warm near-black page (or warm paper, in light mode). The admin lives outside this group. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <script
        // restore the saved light/dark choice before anything paints (dark by default)
        dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('v2-theme')==='light')document.documentElement.setAttribute('data-site-theme','light')}catch(e){}" }}
      />
      <Nav />
      <SoundToggle />
      <main>{children}</main>
      <noscript>
        <style>{'.site .reveal{opacity:1!important;transform:none!important}'}</style>
      </noscript>
    </div>
  );
}

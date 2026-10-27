import { Nav } from '@/components/Nav';
import '../site.css';

/** The public site: a centred monospace nav and a warm near-black page. The admin lives outside this group. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <Nav />
      <main>{children}</main>
    </div>
  );
}

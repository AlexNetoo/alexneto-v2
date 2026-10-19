import Link from 'next/link';
import { site, socials, whatsappUrl } from '@/data/site';

/**
 * Site footer: an outlined call-to-action box, the links, and the ALEX NETO wordmark again, large and cropped
 * at the bottom (it bookends the huge wordmark at the top of the home page). Copy is the live site's.
 */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="cta-box">
        <h2 className="cta-box__title">Let’s work together.</h2>
        <p className="cta-box__text">Got a project in mind? Send a message and let’s talk about what you’re building.</p>
        <a className="btn btn--lg" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          Get in touch
        </a>
      </div>

      <div className="footer-main">
        <div className="footer-side">
        <nav className="footer-links" aria-label="Footer">
          <Link href="/">Work</Link>
          <Link href="/about">About</Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            Contact
          </a>
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </nav>
        <p className="footer-legal">© alexneto. All rights reserved.</p>
        </div>
        <div className="footer-mark" aria-hidden="true">
          <span />
        </div>
      </div>
    </footer>
  );
}

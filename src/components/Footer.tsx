import Link from 'next/link';
import { site, socials, whatsappUrl } from '@/data/site';
import { BackToTop, FooterActions, FooterMark, LocalTime } from './FooterClient';

/**
 * Site footer: an outlined call-to-action box (Get in touch / Copy email), the links in three small columns,
 * Porto's local time and a back-to-top button, then the ALEX NETO wordmark again, huge and cropped by the page
 * edge. It rises into place on scroll and bookends the huge wordmark at the top of the home page.
 * Copy and links are the live site's.
 */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="cta-box">
        <h2 className="cta-box__title">Let’s work together.</h2>
        <p className="cta-box__text">Got a project in mind? Send a message and let’s talk about what you’re building.</p>
        <FooterActions />
      </div>

      <div className="footer-top">
        <nav className="footer-col" aria-label="Pages">
          <span className="footer-col__title">Pages</span>
          <Link href="/">Work</Link>
          <Link href="/about">About</Link>
        </nav>
        <nav className="footer-col" aria-label="Elsewhere">
          <span className="footer-col__title">Elsewhere</span>
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label} ↗
            </a>
          ))}
        </nav>
        <nav className="footer-col" aria-label="Contact">
          <span className="footer-col__title">Contact</span>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp ↗
          </a>
        </nav>
        <div className="footer-meta">
          <LocalTime />
          <p className="footer-legal">© alexneto. All rights reserved.</p>
          <BackToTop />
        </div>
      </div>

      <FooterMark />
    </footer>
  );
}

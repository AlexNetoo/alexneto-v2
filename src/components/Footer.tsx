import { site, socials } from '@/data/site';

/** The site footer: who and where, the contact links, and a way back up. Same 14px type as the rest of the page. */
export function Footer() {
  const links = [{ label: 'email', href: `mailto:${site.email}` }, ...socials.map((s) => ({ label: s.label.toLowerCase(), href: s.href }))];
  return (
    <footer className="footer">
      <p className="footer__who">
        {site.name}
        <span>Product designer, {site.location.split(',')[0]}</span>
      </p>
      <ul className="footer__links">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="footer__end">
        <span>© {new Date().getFullYear()}</span>
        <a href="#main">back to top ↑</a>
      </p>
    </footer>
  );
}

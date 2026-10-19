import { brands } from '@/data/site';

/** "Trusted by" row: client logos (single-colour masks, so they follow light/dark) in an endless, slow marquee. */
export function BrandMarquee() {
  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {brands.map((b) => (
        <li key={b.name}>
          <a className="brand" href={b.href} target="_blank" rel="noopener noreferrer" aria-label={b.name} title={b.name} tabIndex={hidden ? -1 : undefined}>
            <span
              className="brand__logo"
              aria-hidden="true"
              style={{ ['--logo' as string]: `url(${b.logo})`, ['--r' as string]: b.ratio, ['--h' as string]: `${b.height}px` }}
            />
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="brands">
      <span className="brands__label">Trusted by incredible brands</span>
      <div className="marquee">
        <div className="marquee__track">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}

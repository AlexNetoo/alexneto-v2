import { LocalClock } from '@/components/LocalClock';
import { Typed } from '@/components/Typed';
import { experience, socials } from '@/data/site';

export default function Home() {
  const now = experience[0];
  return (
    <section className="pond" aria-label="Introduction">
      <LocalClock />
      <div className="pond__text">
        <div className="pond__tag">
          <Typed lines={['Alex Neto, product designer,', 'with more than 10 years of experience']} />
        </div>
        <div className="pond__intro rise" style={{ ['--d' as string]: '0.4s' }}>
          <p>I drive real business results by designing digital products and websites that are easy to use and scale.</p>
          <p>
            Currently a {now.role.toLowerCase()} as an independent contractor. Before that, Namebase, Namecheap, Defined.ai and Porto Design Factory.
          </p>
        </div>
        <div className="pond__links rise" style={{ ['--d' as string]: '0.55s' }}>
          {socials.map((s, i) => (
            <span key={s.label} style={{ display: 'contents' }}>
              {i > 0 && <span>/</span>}
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label.toLowerCase()}
              </a>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

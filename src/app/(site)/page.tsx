import { LocalClock } from '@/components/LocalClock';
import { Records } from '@/components/Records';
import { Typed } from '@/components/Typed';
import { experience, site, socials } from '@/data/site';
import { getProjects } from '@/lib/projects-store';

export default async function Home() {
  const projects = await getProjects();
  const now = experience[0];
  return (
    <section className="pond" aria-label="Introduction">
      <Records items={projects.map((p) => ({ slug: p.slug, title: p.title }))} />
      <LocalClock />
      <div className="pond__text">
        <div className="pond__tag">
          <Typed lines={['Alex Neto, product designer,', 'with more than 10 years of experience']} />
        </div>
        <div className="pond__intro rise" style={{ ['--d' as string]: '0.4s' }}>
          <p>I drive real business results by designing digital products and websites that are easy to use and scale.</p>
          <p style={{ color: 'var(--fg-2)' }}>
            Currently {now.role.toLowerCase()}, independent. Before that, Namebase, Namecheap, Defined.ai and Porto Design Factory.
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

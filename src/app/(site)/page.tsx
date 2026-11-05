import { DotField } from '@/components/DotField';
import { ProjectRail } from '@/components/ProjectRail';
import { Typed } from '@/components/Typed';
import { socials } from '@/data/site';
import { getProjects } from '@/lib/projects-store';

/** Landing: a short typed intro and links up top, then the projects rail. */
export default async function Home() {
  const projects = await getProjects();
  return (
    <section className="home" aria-label="Introduction">
      <DotField />
      <div className="home__text">
        <div className="home__tag">
          <Typed lines={['Alex Neto, product designer,', 'with more than 10 years of experience']} />
        </div>
        <p className="home__intro rise" style={{ ['--d' as string]: '0.4s' }}>
          Currently work as an independent contractor. Before that, I was designing at Namebase, Namecheap, Defined.ai and Porto Design Factory.
        </p>
        <div className="home__links rise" style={{ ['--d' as string]: '0.55s' }}>
          {socials.map((s, i) => (
            <span key={s.label} style={{ display: 'contents' }}>
              {i > 0 && <span aria-hidden="true">/</span>}
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label.toLowerCase()}
              </a>
            </span>
          ))}
        </div>
      </div>
      <ProjectRail projects={projects} />
    </section>
  );
}

import { DotField } from '@/components/DotField';
import { ProjectRail } from '@/components/ProjectRail';
import { Typed } from '@/components/Typed';
import { getProjects } from '@/lib/projects-store';

const PERSONAL = [
  { title: 'Skip Rest', href: 'https://skiprest.com' },
  { title: 'Done Center', href: 'https://done.center' },
  { title: 'uSwap', href: 'https://uswap.xyz' },
];

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
        <p className="home__links rise" style={{ ['--d' as string]: '0.55s' }}>
          <span className="home__label">Personal projects</span>
          {PERSONAL.map((p, i) => (
            <span key={p.href} style={{ display: 'contents' }}>
              {i > 0 && <span aria-hidden="true">/</span>}
              <a href={p.href} target="_blank" rel="noopener noreferrer">
                {p.title}
              </a>
            </span>
          ))}
        </p>
      </div>
      <ProjectRail projects={projects} />
    </section>
  );
}

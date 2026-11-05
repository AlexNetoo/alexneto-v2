import Link from 'next/link';
import { DotField } from '@/components/DotField';
import { ProjectRail } from '@/components/ProjectRail';
import { Typed } from '@/components/Typed';
import { getProjects } from '@/lib/projects-store';

const PERSONAL = [
  { slug: 'skip-rest', title: 'Skip Rest' },
  { slug: 'donecenter', title: 'Done Center' },
  { slug: 'uswap', title: 'uSwap' },
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
            <span key={p.slug} style={{ display: 'contents' }}>
              {i > 0 && <span aria-hidden="true">/</span>}
              <Link href={`/projects/${p.slug}`}>{p.title}</Link>
            </span>
          ))}
        </p>
      </div>
      <ProjectRail projects={projects} />
    </section>
  );
}

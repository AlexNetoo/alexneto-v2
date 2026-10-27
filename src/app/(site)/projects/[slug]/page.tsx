import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Frame, tint } from '@/components/Frame';
import { ShotCarousel } from '@/components/ShotCarousel';
import { categoryOf, linkHost, metaLine, nextProject, prevProject } from '@/data/projects';
import { site } from '@/data/site';
import { getProjects } from '@/lib/projects-store';

type Params = { slug: string };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getProjects()).find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.title, description: p.description ?? `${p.title}, ${metaLine(p)}, by ${site.name}.` };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const projects = await getProjects();
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();

  const shots = p.gallery.length ? p.gallery : [p.cover];
  const [lead, ...rest] = shots;
  const prev = prevProject(projects, slug);
  const next = nextProject(projects, slug);

  const facts: [string, React.ReactNode][] = [
    ['scope', categoryOf(p)],
    ...(p.industry ? ([['industry', p.industry]] as [string, string][]) : []),
    ...(p.year ? ([['timeframe', p.year]] as [string, string][]) : []),
    ...(p.link
      ? ([
          [
            'website',
            <a key="l" href={p.link} target="_blank" rel="noopener noreferrer">
              {linkHost(p)} ↗
            </a>,
          ],
        ] as [string, React.ReactNode][])
      : []),
  ];

  return (
    <article className="project" style={{ ['--bg-img' as string]: `url("${tint(lead.src)}")` } as React.CSSProperties}>
      <div className="project__band" aria-hidden="true">
        <span />
      </div>

      <header className="project__head">
        <Link href="/projects" className="project__back rise">
          ← projects
        </Link>
        <h1 className="rise" style={{ ['--d' as string]: '0.05s' }}>
          {p.title}
        </h1>
        <p className="project__sub rise" style={{ ['--d' as string]: '0.1s' }}>
          {[categoryOf(p), p.industry].filter(Boolean).join(' · ')}
        </p>
        {p.description && (
          <p className="project__desc rise" style={{ ['--d' as string]: '0.15s' }}>
            {p.description}
          </p>
        )}
        <dl className="project__facts rise" style={{ ['--d' as string]: '0.2s' }}>
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="project__body">
        <div className="rise" style={{ ['--d' as string]: '0.25s' }}>
          <Frame img={lead} alt={`${p.title} cover`} priority />
        </div>
        {rest.length > 0 && <ShotCarousel items={rest} label="screens" alt={`${p.title} screen`} />}
      </div>

      <nav className="pager" aria-label="More projects">
        {[
          { p: prev, dir: '← previous' },
          { p: next, dir: 'next →' },
        ].map(({ p: q, dir }) => (
          <Link key={dir} href={`/projects/${q.slug}`}>
            <span className="pager__dir">{dir}</span>
            <span className="pager__title">{q.title}</span>
            {q.year && <span className="pager__year">{q.year}</span>}
            <span className="pager__desc">{q.description ?? metaLine(q)}</span>
          </Link>
        ))}
      </nav>
    </article>
  );
}

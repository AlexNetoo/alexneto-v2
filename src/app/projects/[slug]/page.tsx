import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { categoryOf, linkHost, metaLine, moreProjects, type Img } from '@/data/projects';
import { getProjects } from '@/lib/projects-store';
import { site } from '@/data/site';

type Params = { slug: string };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getProjects()).find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.title, description: `${p.title}, ${metaLine(p)}, by ${site.name}.` };
}

function Shot({ img, alt, priority = false }: { img: Img; alt: string; priority?: boolean }) {
  return (
    <div className="pp-shot">
      {img.animated ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img.src} alt={alt} width={img.w} height={img.h} loading="lazy" />
      ) : (
        <Image src={img.src} alt={alt} width={img.w} height={img.h} quality={82} sizes="(max-width: 699px) 100vw, 70vw" priority={priority} />
      )}
    </div>
  );
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const projects = await getProjects();
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();

  // the cover (first image) now sits below the details, as the first image of the gallery
  const shots = p.gallery.length ? p.gallery : [p.cover];
  const more = moreProjects(projects, slug, 2);
  const details: [string, string | React.ReactNode][] = [
    ['Project', p.title],
    ...(p.year ? ([['Timeframe', p.year]] as [string, string][]) : []),
    ...(p.industry ? ([['Industry', p.industry]] as [string, string][]) : []),
    ['Scope', categoryOf(p)],
    ...(p.link
      ? ([
          [
            'Website',
            <a key="l" href={p.link} target="_blank" rel="noopener noreferrer" className="u">
              {linkHost(p)} ↗
            </a>,
          ],
        ] as [string, React.ReactNode][])
      : []),
  ];

  return (
    <>
      <section className="pp-title">
        <h1>{p.title}</h1>
      </section>

      <section className="pp-intro">
        <Reveal className="pp-intro__text">
          <span className="section-label">Overview</span>
          {p.description && <p className="pp-intro__desc">{p.description}</p>}
        </Reveal>
        <Reveal delay={0.08} className="pp-intro__details">
          <span className="section-label">Details</span>
          <dl className="pp-details">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {shots.length > 0 && (
        <section className="pp-gallery" aria-label={`${p.title} screens`}>
          {shots.map((img, i) => (
            <Reveal key={img.src}>
              <Shot img={img} alt={`${p.title} screen`} priority={i === 0} />
            </Reveal>
          ))}
        </section>
      )}

      <section className="pp-more">
        <Reveal>
          <h2 className="pp-more__title">More projects</h2>
        </Reveal>
        <div className="pp-more__grid">
          {more.map((m, i) => (
            <Reveal key={m.slug} delay={i * 0.08}>
              <Link href={`/projects/${m.slug}`} className="more-card">
                <span className="more-card__img">
                  <Image src={m.cover.src} alt="" fill quality={80} sizes="(max-width: 699px) 100vw, 50vw" style={m.focus ? { objectPosition: m.focus } : undefined} />
                </span>
                <span className="more-card__name">{m.title}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

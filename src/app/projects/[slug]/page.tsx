import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { categoryOf, linkHost, metaLine, moreProjects, projects, type Img } from '@/data/projects';
import { site } from '@/data/site';

type Params = { slug: string };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
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
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();

  const hero = p.gallery[0] ?? p.cover;
  const rest = p.gallery.slice(1);
  const more = moreProjects(slug, 2);
  const details: [string, string | React.ReactNode][] = [
    ['Project', p.title],
    ...(p.year ? ([['Timeframe', p.year]] as [string, string][]) : []),
    ['Role', site.role],
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
      <section className="pp-hero">
        {/* wide image on larger screens, the square cover on phones (a tall crop of a 16:9 screen is unreadable) */}
        {hero.animated ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.src} alt="" className="pp-hero__img pp-hero__img--wide" />
        ) : (
          <Image src={hero.src} alt="" fill priority quality={82} sizes="100vw" className="pp-hero__img pp-hero__img--wide" style={p.focus ? { objectPosition: p.focus } : undefined} />
        )}
        <Image src={p.cover.src} alt="" fill quality={80} sizes="100vw" className="pp-hero__img pp-hero__img--phone" style={p.focus ? { objectPosition: p.focus } : undefined} />
        <div className="pp-hero__shade" />
        <h1 className="pp-hero__title">{p.title}</h1>
      </section>

      <section className="pp-intro">
        <Reveal className="pp-intro__text">
          <span className="section-label">Overview</span>
          <p className="pp-intro__lead">
            {p.title}
            <span className="pp-intro__sub">{[categoryOf(p), p.industry, p.year].filter(Boolean).join(' · ')}</span>
          </p>
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

      {rest.length > 0 && (
        <section className="pp-gallery" aria-label={`${p.title} screens`}>
          {rest.map((img, i) => (
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

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/Reveal';
import { categoryOf, linkHost, metaLine, nextProject, projects } from '@/data/projects';
import { site, whatsappUrl } from '@/data/site';

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

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();
  const next = nextProject(slug);
  const shots = p.gallery.length ? p.gallery : [p.cover];

  return (
    <>
      <section className="pp-head">
        <Reveal>
          <h1 className="pp-title">{p.title}</h1>
        </Reveal>
        <Reveal delay={0.08}>
          <dl className="pp-meta">
            <div>
              <dt>Scope</dt>
              <dd>{categoryOf(p)}</dd>
            </div>
            {p.industry && (
              <div>
                <dt>Industry</dt>
                <dd>{p.industry}</dd>
              </div>
            )}
            {p.year && (
              <div>
                <dt>Year</dt>
                <dd>{p.year}</dd>
              </div>
            )}
            {p.link && (
              <div>
                <dt>Live site</dt>
                <dd>
                  <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textUnderlineOffset: 4 }}>
                    {linkHost(p)} ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </Reveal>
      </section>

      <section className="pp-gallery">
        {shots.map((img, i) => (
          <Reveal key={img.src}>
            <div className="pp-shot">
              {img.animated ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.src} alt={`${p.title} screen ${i + 1} of ${shots.length}`} width={img.w} height={img.h} loading="lazy" />
              ) : (
                <Image
                  src={img.src}
                  alt={`${p.title} screen ${i + 1} of ${shots.length}`}
                  width={img.w}
                  height={img.h}
                  priority={i === 0}
                  quality={82}
                  sizes="(max-width: 699px) 100vw, 90vw"
                />
              )}
            </div>
          </Reveal>
        ))}
      </section>

      <section className="pp-next">
        <span className="section-label">Next project</span>
        <Link href={`/projects/${next.slug}`} className="pp-next__link">
          {next.title} →
        </Link>
      </section>

      <div className="cta-row">
        <a className="btn" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          Get in touch
        </a>
      </div>
      <footer className="footer">© alexneto. All rights reserved.</footer>
    </>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import { Footer } from '@/components/Footer';
import { Reveal } from '@/components/Reveal';
import { ResumeTabs } from '@/components/ResumeTabs';
import { bio, experience, site, teaching } from '@/data/site';

export const metadata: Metadata = { title: 'About', description: site.description };

export default function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <h1 className="statement">{bio.lead}</h1>
      </section>

      <section className="about-grid">
        <Reveal>
          <div className="portrait">
            <Image src="/profile.jpg" alt={`Portrait of ${site.name}`} fill sizes="(max-width: 899px) 100vw, 40vw" priority quality={80} />
          </div>
        </Reveal>
        <Reveal delay={0.08} className="about-copy">
          <div>
            {bio.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="facts">
            {bio.facts.map((f) => (
              <div key={f.label} className="fact">
                <dt>{f.label}</dt>
                <dd>{f.href ? <a href={f.href} style={{ textDecoration: 'underline', textUnderlineOffset: 4 }}>{f.value}</a> : f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="resume" id="resume">
        <Reveal className="resume__head">
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="section-label">Résumé</span>
            <h2 className="resume__title">Where I’ve worked</h2>
          </div>
        </Reveal>
        <Reveal>
          <ResumeTabs experience={experience} teaching={teaching} />
        </Reveal>
      </section>

      <section className="offclock">
        <Reveal>
          <p className="statement">{bio.personal}</p>
        </Reveal>
      </section>


      <Footer />
    </>
  );
}

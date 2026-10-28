import type { Metadata } from 'next';
import Image from 'next/image';
import { Reveal } from '@/components/Reveal';
import { bio, experience, services, site, socials, teaching, whatsappUrl, type ResumeRow } from '@/data/site';

export const metadata: Metadata = { title: 'About', description: site.description };

function Rows({ rows }: { rows: ResumeRow[] }) {
  return (
    <div className="rows">
      {rows.map((r) => (
        <div key={`${r.org}-${r.period}`} className="row">
          <span className="row__when">{r.period}</span>
          <span className="row__what">
            {r.org}
            <span>{r.role}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="about">
      <header className="about__head rise">
        <div>
          <h1>{site.name}</h1>
          <p className="about__role">
            {site.role} · {site.location}
          </p>
          <div className="about__copy">
            <p>{bio.lead}</p>
            {bio.paragraphs.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
        </div>
        <div className="about__portrait">
          <Image src="/profile.jpg" alt={`Portrait of ${site.name}`} fill sizes="168px" priority quality={80} />
        </div>
      </header>

      <Reveal><section>
        <h2 className="section__label">Professional experience</h2>
        <Rows rows={experience} />
      </section></Reveal>

      <Reveal><section>
        <h2 className="section__label">Teaching experience</h2>
        <Rows rows={teaching} />
      </section></Reveal>

      <Reveal><section>
        <h2 className="section__label">My focus areas</h2>
        <div className="rows">
          {services.map((s) => (
            <div key={s.title} className="row">
              <span className="row__when" style={{ color: 'var(--fg)', fontFamily: 'var(--sans)', fontSize: 14 }}>
                {s.title}
              </span>
              <span className="row__what">
                {s.caption}
                <span>{s.description}</span>
              </span>
            </div>
          ))}
        </div>
      </section></Reveal>

      <Reveal><section>
        <h2 className="section__label">Get in touch</h2>
        <div className="contact-links">
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            whatsapp
          </a>
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label.toLowerCase()}
            </a>
          ))}
        </div>
      </section></Reveal>
    </div>
  );
}

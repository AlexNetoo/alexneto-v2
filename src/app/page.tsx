import { Reveal } from '@/components/Reveal';
import { ProjectCard } from '@/components/ProjectCard';
import { projects } from '@/data/projects';
import { site, whatsappUrl } from '@/data/site';

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1 className="statement">{site.headline}</h1>
      </section>

      <section className="projects" aria-label="Selected projects">
        {projects.map((p, i) => (
          <ProjectCard key={p.slug} project={p} index={i} />
        ))}
      </section>

      <Reveal className="cta-row">
        <a className="btn" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          Get in touch
        </a>
      </Reveal>

      <footer className="footer">© alexneto. All rights reserved.</footer>
    </>
  );
}

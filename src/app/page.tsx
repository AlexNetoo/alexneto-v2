import { Footer } from '@/components/Footer';
import { ProjectCard } from '@/components/ProjectCard';
import { site } from '@/data/site';
import { getProjects } from '@/lib/projects-store';

export default async function Home() {
  const projects = await getProjects();
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


      <Footer />
    </>
  );
}

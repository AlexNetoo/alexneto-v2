import type { Metadata } from 'next';
import { ProjectRail } from '@/components/ProjectRail';
import { getProjects } from '@/lib/projects-store';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <div className="rail-page">
      <ProjectRail projects={projects} />
    </div>
  );
}

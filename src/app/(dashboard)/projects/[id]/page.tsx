import { getProject } from '@/actions/projects'
import { notFound } from 'next/navigation'
import { ProjectDetailView } from '@/components/projects/project-detail-view'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  return <ProjectDetailView project={project} />
}

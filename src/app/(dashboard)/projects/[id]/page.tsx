import { getProject } from '@/actions/projects'
import { getAllVendorsSimple } from '@/actions/vendors'
import { getAllContractorsSimple } from '@/actions/contractors'
import { notFound } from 'next/navigation'
import { ProjectDetailView } from '@/components/projects/project-detail-view'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, allVendors, allContractors] = await Promise.all([
    getProject(id),
    getAllVendorsSimple(),
    getAllContractorsSimple(),
  ])
  if (!project) notFound()

  return <ProjectDetailView project={project} allVendors={allVendors} allContractors={allContractors} />
}

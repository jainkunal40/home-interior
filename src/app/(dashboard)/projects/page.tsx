import { getProjects } from '@/actions/projects'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'

export default function ProjectsPage() {
  // Redirect to dashboard which shows all projects
  redirect('/dashboard')
}

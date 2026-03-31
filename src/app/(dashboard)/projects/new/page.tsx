'use client'

import { useActionState } from 'react'
import { createProject } from '@/actions/projects'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PROJECT_STATUSES } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const [state, formAction, isPending] = useActionState(createProject, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state.projectId) {
      router.push(`/projects/${state.projectId}`)
    }
  }, [state, router])

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Project</h1>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
        )}

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Project Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input name="name" label="Project Name *" placeholder="e.g., 3BHK Interior — Green Valley" required />
            <Textarea name="description" label="Description" placeholder="Brief project description..." />
            <Input name="siteAddress" label="Site Address / Location" placeholder="e.g., A-201, Green Valley, Pune" />
            <div className="grid grid-cols-2 gap-3">
              <Select name="status" label="Status" options={[...PROJECT_STATUSES]} defaultValue="planning" />
              <Input name="budget" label="Budget (₹)" type="number" prefix="₹" placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="startDate" label="Start Date" type="date" />
              <Input name="endDate" label="End Date" type="date" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Client Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input name="clientName" label="Client Name" placeholder="e.g., Mr. Rajesh Patel" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="clientPhone" label="Phone" type="tel" placeholder="+91 98765 43210" />
              <Input name="clientEmail" label="Email" type="email" placeholder="client@email.com" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-2 pb-20 sm:pb-4">
          <Link href="/dashboard" className="flex-1 sm:flex-none">
            <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
          </Link>
          <Button type="submit" className="flex-1 sm:flex-none" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  )
}

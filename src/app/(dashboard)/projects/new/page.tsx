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
import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Copy, Check, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/modal'

export default function NewProjectPage() {
  const [state, formAction, isPending] = useActionState(createProject, null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state.projectId) {
      if (state.clientPassword) {
        setShowCredentials(true)
      } else {
        router.push(`/projects/${state.projectId}`)
      }
    }
  }, [state, router])

  function copyCredentials() {
    if (!state?.clientEmail || !state?.clientPassword) return
    const text = `Login Email: ${state.clientEmail}\nPassword: ${state.clientPassword}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function goToProject() {
    if (state?.projectId) router.push(`/projects/${state.projectId}`)
  }

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
            <p className="text-xs text-gray-400">If email is provided, a client portal login will be auto-created. You&apos;ll see the credentials after project creation.</p>
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

      {/* Client credentials modal */}
      <Modal open={showCredentials} onClose={goToProject} title="Client Portal Credentials">
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-800">Project created successfully!</p>
            </div>
            <p className="text-sm text-green-700">
              A portal login has been created for the client. Share these credentials so they can access their project portal.
            </p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Login Email</span>
              <span className="text-sm font-medium text-gray-900">{state?.clientEmail}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Password</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-mono text-gray-900">
                  {showPassword ? state?.clientPassword : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-gray-400 hover:text-brand-600 rounded min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={copyCredentials}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <Button onClick={goToProject} className="flex-1">
              Go to Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

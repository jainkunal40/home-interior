'use client'

import { useState, useEffect, useActionState } from 'react'
import { createMilestone, updateMilestone, deleteMilestone } from '@/actions/milestones'
import { getLabelForValue, MILESTONE_STATUSES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Plus, Flag, Trash2, CheckCircle2, Clock, AlertCircle, Edit2 } from 'lucide-react'
import { format } from 'date-fns'

export function MilestonesTab({ project }: { project: any }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const milestones = project.milestones
  const completed = milestones.filter((m: any) => m.status === 'completed').length
  const total = milestones.length
  const phases = project.phases || []

  function openAdd() { setEditItem(null); setShowForm(true) }
  function openEdit(item: any) { setEditItem(item); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditItem(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Milestones</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            {completed} of {total} completed
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add Milestone
        </Button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-brand-600">
              {Math.round((completed / total) * 100)}%
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <EmptyState
          icon={<Flag className="w-12 h-12" />}
          title="No milestones yet"
          description="Add milestones to track project progress and deadlines."
          action={<Button size="sm" onClick={openAdd}>Add First Milestone</Button>}
        />
      ) : (
        <div className="space-y-2">
          {milestones.map((m: any, idx: number) => {
            const statusInfo = MILESTONE_STATUSES.find(s => s.value === m.status)
            const isOverdue = m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed'
            const StatusIcon = m.status === 'completed' ? CheckCircle2 : isOverdue ? AlertCircle : Clock

            return (
              <Card key={m.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-0.5">
                      <StatusIcon className={`w-5 h-5 shrink-0 ${
                        m.status === 'completed' ? 'text-green-500' :
                        isOverdue ? 'text-red-500' :
                        m.status === 'in_progress' ? 'text-blue-500' :
                        'text-gray-300'
                      }`} />
                      {idx < milestones.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1" onClick={() => openEdit(m)} role="button" tabIndex={0}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{m.title}</span>
                        <Badge className={statusInfo?.color || ''}>
                          {statusInfo?.label || m.status}
                        </Badge>
                        {isOverdue && <Badge className="bg-red-50 text-red-700">Overdue</Badge>}
                      </div>
                      {m.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {m.dueDate && <span>Due: {format(new Date(m.dueDate), 'dd MMM yyyy')}</span>}
                        {m.completionDate && <span>Completed: {format(new Date(m.completionDate), 'dd MMM yyyy')}</span>}
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => openEdit(m)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <form action={async () => { if (confirm('Delete this milestone?')) await deleteMilestone(m.id, project.id) }}>
                        <button type="submit" className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 min-w-[40px] min-h-[40px] flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Phase Overview */}
      {phases.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Phases</h3>
            <div className="space-y-2">
              {phases.map((phase: any) => {
                const phaseColor = phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                  phase.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                return (
                  <div key={phase.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{phase.name}</span>
                    <Badge className={phaseColor}>
                      {phase.status === 'in_progress' ? 'In Progress' :
                        phase.status === 'completed' ? 'Done' : 'Pending'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Milestone Modal */}
      <Modal open={showForm} onClose={closeForm} title={editItem ? 'Edit Milestone' : 'Add Milestone'}>
        <MilestoneForm project={project} editItem={editItem} onClose={closeForm} />
      </Modal>
    </div>
  )
}

function MilestoneForm({ project, editItem, onClose }: { project: any; editItem: any; onClose: () => void }) {
  const isEdit = !!editItem
  const action = isEdit
    ? updateMilestone.bind(null, editItem.id, project.id)
    : createMilestone.bind(null, project.id)
  const [state, formAction, isPending] = useActionState(action, null)
  const phases = project.phases || []

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}
      <Input name="title" label="Title *" placeholder="e.g., Civil work completed" defaultValue={editItem?.title || ''} required />
      <Textarea name="description" label="Description" placeholder="Details about this milestone..." defaultValue={editItem?.description || ''} />
      <div className="grid grid-cols-2 gap-3">
        <Input name="dueDate" label="Due Date" type="date" defaultValue={editItem?.dueDate ? new Date(editItem.dueDate).toISOString().split('T')[0] : ''} />
        <Input name="completionDate" label="Completion Date" type="date" defaultValue={editItem?.completionDate ? new Date(editItem.completionDate).toISOString().split('T')[0] : ''} />
      </div>
      <Select
        name="status"
        label="Status"
        options={MILESTONE_STATUSES.map(s => ({ value: s.value, label: s.label }))}
        defaultValue={editItem?.status || 'pending'}
      />
      {phases.length > 0 && (
        <Select
          name="phaseId"
          label="Link to Phase"
          options={[{ value: '', label: 'Not linked' }, ...phases.map((p: any) => ({ value: p.id, label: p.name }))]}
          defaultValue={editItem?.phaseId || ''}
        />
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving...' : isEdit ? 'Update Milestone' : 'Save Milestone'}
        </Button>
      </div>
    </form>
  )
}

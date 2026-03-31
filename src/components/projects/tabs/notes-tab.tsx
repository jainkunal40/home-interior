'use client'

import { useState } from 'react'
import { createNote, deleteNote, updateNote } from '@/actions/milestones'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { Plus, MessageSquare, Trash2, Pencil, X, Check } from 'lucide-react'
import { format } from 'date-fns'

export function NotesTab({ project }: { project: any }) {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    const result = await createNote(project.id, formData)
    setSubmitting(false)
    if (result?.error) {
      alert(result.error)
    } else {
      setShowForm(false)
    }
  }

  async function handleUpdate(noteId: string) {
    if (!editContent.trim()) return
    setSubmitting(true)
    const result = await updateNote(noteId, project.id, editContent)
    setSubmitting(false)
    if (result?.error) {
      alert(result.error)
    } else {
      setEditingId(null)
      setEditContent('')
    }
  }

  function startEdit(note: any) {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notes</h3>
          <p className="text-sm text-gray-600 mt-0.5">{project.notes.length} note{project.notes.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </div>

      {/* Inline Add Note Form */}
      {showForm && (
        <Card>
          <CardContent className="p-3">
            <form action={handleSubmit} className="space-y-3">
              <Textarea
                name="content"
                placeholder="Write a note... (e.g., client wants marble flooring changed to vitrified tiles)"
                required
                autoFocus
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Note'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {project.notes.length === 0 && !showForm ? (
        <EmptyState
          icon={<MessageSquare className="w-12 h-12" />}
          title="No notes yet"
          description="Add notes about client preferences, site decisions, or reminders."
          action={<Button size="sm" onClick={() => setShowForm(true)}>Add First Note</Button>}
        />
      ) : (
        <div className="space-y-2">
          {project.notes.map((note: any) => (
            <Card key={note.id}>
              <CardContent className="p-3 sm:p-4">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setEditContent('') }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(note.id)}
                        disabled={submitting}
                        className="p-1.5 text-green-500 hover:text-green-700 rounded-lg hover:bg-green-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(note.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        className="p-1.5 text-gray-300 hover:text-brand-600 rounded-lg hover:bg-brand-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <form action={async () => { await deleteNote(note.id, project.id) }}>
                        <button type="submit" className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

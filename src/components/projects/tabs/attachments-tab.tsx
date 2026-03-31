'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Plus, Paperclip, Trash2, FileText, Image, Download, Upload, Eye } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { format } from 'date-fns'

const FILE_CATEGORIES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'bill', label: 'Bill' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'photo', label: 'Photo' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentsTab({ project }: { project: any }) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadCategory, setUploadCategory] = useState('receipt')

  const attachments = filterCategory === 'all'
    ? project.attachments
    : project.attachments.filter((a: any) => a.category === filterCategory)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', project.id)
    formData.append('category', uploadCategory)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Upload failed')
      } else {
        setShowUpload(false)
        window.location.reload()
      }
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(attachmentId: string) {
    if (!confirm('Delete this attachment?')) return
    try {
      await fetch(`/api/upload?id=${attachmentId}`, { method: 'DELETE' })
      window.location.reload()
    } catch {
      alert('Delete failed')
    }
  }

  const isImage = (type: string) => type.startsWith('image/')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Attachments & Receipts
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">{project.attachments.length} file{project.attachments.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>

      {/* Filter */}
      {project.attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterCategory === 'all'
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({project.attachments.length})
          </button>
          {FILE_CATEGORIES.map(cat => {
            const count = project.attachments.filter((a: any) => a.category === cat.value).length
            if (count === 0) return null
            return (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(filterCategory === cat.value ? 'all' : cat.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filterCategory === cat.value
                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {attachments.length === 0 ? (
        <EmptyState
          icon={<Paperclip className="w-12 h-12" />}
          title="No attachments"
          description="Upload receipts, bills, quotations, photos, and other documents."
          action={<Button size="sm" onClick={() => setShowUpload(true)}>Upload File</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {/* File icon or thumbnail */}
                  <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {isImage(a.fileType) ? (
                      <img
                        src={a.fileUrl}
                        alt={a.fileName}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewUrl(a.fileUrl)}
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <Badge className="bg-gray-50 text-gray-600">{a.category}</Badge>
                      <span>{formatFileSize(a.fileSize)}</span>
                      <span>{format(new Date(a.createdAt), 'dd MMM')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isImage(a.fileType) && (
                      <button
                        onClick={() => setPreviewUrl(a.fileUrl)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <a
                      href={a.fileUrl}
                      download={a.fileName}
                      className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <Modal open={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Preview">
          <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
        </Modal>
      )}

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload File">
        <form onSubmit={handleUpload} className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">File *</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
            />
            <p className="text-xs text-gray-400">JPEG, PNG, WebP, or PDF. Max 10MB.</p>
          </div>
          <Select
            name="category"
            label="Category"
            options={FILE_CATEGORIES}
            defaultValue="receipt"
            onChange={(e) => setUploadCategory(e.target.value)}
          />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowUpload(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

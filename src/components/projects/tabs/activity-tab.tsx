import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Activity } from 'lucide-react'
import { format } from 'date-fns'

const ICONS: Record<string, string> = {
  payment_received: '💵',
  expense_submitted: '📤',
  expense_approved: '✅',
  expense_rejected: '❌',
  milestone_completed: '🎯',
  created: '🆕',
  updated: '✏️',
  deleted: '🗑️',
  status_changed: '🔄',
  phase_updated: '📋',
  labor_added: '👷',
  attachment_uploaded: '📎',
  note_added: '📝',
}

function icon(action: string) {
  return ICONS[action] ?? '📌'
}

export async function ActivityTab({ projectId }: { projectId: string }) {
  const logs = await prisma.activityLog.findMany({
    where: { projectId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="w-14 h-14" />}
        title="No activity yet"
        description="Actions like payments, expense approvals, and milestone updates will appear here."
      />
    )
  }

  // Group by date
  const groups: Record<string, typeof logs> = {}
  for (const log of logs) {
    const key = format(new Date(log.createdAt), 'dd MMM yyyy')
    if (!groups[key]) groups[key] = []
    groups[key].push(log)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Activity Log</h3>
        <span className="text-xs text-gray-400">{logs.length} event{logs.length !== 1 ? 's' : ''}</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {Object.entries(groups).map(([date, items]) => (
              <div key={date}>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{date}</p>
                </div>
                {items.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-lg shrink-0 mt-0.5">{icon(log.action)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">{log.details}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {format(new Date(log.createdAt), 'hh:mm a')}
                        </span>
                        {log.user && (
                          <>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{log.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

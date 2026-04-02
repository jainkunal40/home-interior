import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { formatINR } from '@/lib/currency'
import { getStatusColor, getLabelForValue, PROJECT_STATUSES, MILESTONE_STATUSES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SummaryCard } from '@/components/ui/summary-card'
import { ArrowLeft, CheckCircle, Clock, IndianRupee, Wallet, Receipt } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const client = await prisma.client.findFirst({
    where: { userId: session.user.id },
  })
  if (!client) redirect('/portal')

  const project = await prisma.project.findFirst({
    where: { id, clientId: client.id },
    include: {
      incomeTransactions: { orderBy: { date: 'desc' } },
      expenseTransactions: { where: { paidByClient: true }, select: { amount: true, taxAmount: true, laborEntryId: true } },
      laborEntries: { where: { paidByClient: true }, select: { totalAmount: true, advancePaid: true, payments: { select: { amount: true, taxAmount: true } } } },
      milestones: { orderBy: { dueDate: 'asc' } },
      phases: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!project) notFound()

  const paidToOwner = project.incomeTransactions.reduce((s, t) => s + t.amount, 0)
  // Client-paid expenses (exclude labor-linked — those are counted under labor)
  const clientPaidExpenses = project.expenseTransactions
    .filter(t => !t.laborEntryId)
    .reduce((s, t) => s + t.amount + t.taxAmount, 0)
  // For labor: only count what's actually been paid (advance + linked payments), not full contract
  const clientPaidLabor = project.laborEntries.reduce((s, entry) => {
    const payments = entry.payments.reduce((ps, p) => ps + p.amount + p.taxAmount, 0)
    return s + entry.advancePaid + payments
  }, 0)
  const totalPaid = paidToOwner + clientPaidExpenses + clientPaidLabor
  const completedMilestones = project.milestones.filter(m => m.status === 'completed').length
  const remainingBudget = project.budget - totalPaid

  return (
    <div className="space-y-6">
      <Link href="/portal" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 min-h-[44px]">
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project.name}</h1>
          <Badge className={getStatusColor(project.status)}>
            {getLabelForValue(PROJECT_STATUSES, project.status)}
          </Badge>
        </div>
        {project.siteAddress && <p className="text-sm text-gray-500 mt-0.5">{project.siteAddress}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Budget" value={project.budget} icon={<Wallet className="w-4 h-4" />} />
        <SummaryCard label="Total Paid" value={totalPaid} trend="up" icon={<IndianRupee className="w-4 h-4" />} />
        <SummaryCard label="Remaining" value={remainingBudget} icon={<Receipt className="w-4 h-4" />} />
        <SummaryCard
          label="Milestones"
          value={`${completedMilestones}/${project.milestones.length}`}
          isText
          icon={<CheckCircle className="w-4 h-4" />}
        />
      </div>

      {/* Payment History */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Payment History</h2>
          {project.incomeTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No payments recorded yet</p>
          ) : (
            <div className="space-y-2">
              {project.incomeTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.receivedFrom || t.paymentType || 'Payment'}</p>
                    <p className="text-xs text-gray-400">{format(new Date(t.date), 'dd MMM yyyy')}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">+{formatINR(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Project Milestones</h2>
          {project.milestones.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No milestones set</p>
          ) : (
            <div className="space-y-2">
              {project.milestones.map((m) => (
                <div key={m.id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    {m.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{m.title}</p>
                      {m.dueDate && (
                        <p className="text-xs text-gray-400">Due: {format(new Date(m.dueDate), 'dd MMM yyyy')}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={MILESTONE_STATUSES.find(s => s.value === m.status)?.color || 'bg-gray-100 text-gray-700'}>
                    {getLabelForValue(MILESTONE_STATUSES, m.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Timeline */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Project Phases</h2>
          <div className="space-y-1">
            {project.phases.map((phase) => (
              <div key={phase.id} className="flex items-center gap-2 py-1.5">
                <div className={`w-2 h-2 rounded-full ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-200'}`} />
                <span className={`text-sm ${phase.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {phase.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

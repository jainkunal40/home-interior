import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { formatINR } from '@/lib/currency'
import { getStatusColor, getLabelForValue, PROJECT_STATUSES, MILESTONE_STATUSES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SummaryCard } from '@/components/ui/summary-card'
import { ArrowLeft, CheckCircle, Clock, IndianRupee, Wallet, Receipt, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ClientExpenseForm } from './client-expense-form'

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
      expenseTransactions: {
        where: { paidByClient: true },
        select: { id: true, amount: true, taxAmount: true, laborEntryId: true, date: true, notes: true, category: true, approvalStatus: true, vendor: { select: { name: true } } },
        orderBy: { date: 'desc' },
      },
      laborEntries: { where: { paidByClient: true }, select: { advancePaid: true } },
      milestones: { orderBy: { dueDate: 'asc' } },
      phases: { orderBy: { sortOrder: 'asc' } },
      projectVendors: { include: { vendor: true } },
      projectContractors: { include: { contractor: true } },
    },
  })

  if (!project) notFound()

  // Only count approved expenses in totals
  const approvedExpenses = project.expenseTransactions.filter(t => t.approvalStatus === 'approved')
  const pendingExpenses = project.expenseTransactions.filter(t => t.approvalStatus === 'pending')
  const pendingTotal = pendingExpenses.reduce((s, t) => s + t.amount + t.taxAmount, 0)

  const paidToOwner = project.incomeTransactions.reduce((s, t) => s + t.amount, 0)
  // Client-paid expenses (exclude labor-linked — those are already in advancePaid). Only approved.
  const clientPaidExpenses = approvedExpenses
    .filter(t => !t.laborEntryId)
    .reduce((s, t) => s + t.amount + t.taxAmount, 0)
  // advancePaid is auto-calculated as the sum of linked expense payments
  const clientPaidLabor = project.laborEntries.reduce((s, entry) => s + entry.advancePaid, 0)
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

      {/* Pending Approval Banner */}
      {pendingTotal > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">Pending Approval</p>
                  <p className="text-xs text-amber-600">{pendingExpenses.length} expense{pendingExpenses.length !== 1 ? 's' : ''} awaiting owner approval</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-700">{formatINR(pendingTotal)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Expense */}
      <ClientExpenseForm
        projectId={project.id}
        vendors={(project as any).projectVendors?.map((pv: any) => pv.vendor) ?? []}
        contractors={(project as any).projectContractors?.map((pc: any) => pc.contractor) ?? []}
      />

      {/* Client Submitted Expenses */}
      {project.expenseTransactions.some(t => t.approvalStatus === 'pending' || t.approvalStatus === 'rejected') && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Your Submitted Expenses</h2>
            <div className="space-y-2">
              {project.expenseTransactions
                .filter(t => t.approvalStatus === 'pending' || t.approvalStatus === 'rejected')
                .map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{t.notes || t.category || 'Expense'}</p>
                      {t.approvalStatus === 'pending' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">Pending</span>
                      )}
                      {t.approvalStatus === 'rejected' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">Rejected</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{format(new Date(t.date), 'dd MMM yyyy')}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{formatINR(t.amount + t.taxAmount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Payment History</h2>
          {(() => {
            // Combine all client payments: income (paid to owner) + client-paid expenses
            const allPayments = [
              ...project.incomeTransactions.map(t => ({
                id: t.id,
                label: t.receivedFrom || t.paymentType || 'Payment to Owner',
                date: t.date,
                amount: t.amount,
                type: 'income' as const,
              })),
              ...project.expenseTransactions
                .filter(t => !t.laborEntryId)
                .map(t => ({
                  id: t.id,
                  label: t.notes || t.vendor?.name || t.category || 'Direct Payment',
                  date: t.date,
                  amount: t.amount + t.taxAmount,
                  type: 'expense' as const,
                })),
              ...project.expenseTransactions
                .filter(t => t.laborEntryId)
                .map(t => ({
                  id: t.id,
                  label: t.notes || t.vendor?.name || 'Labor Payment',
                  date: t.date,
                  amount: t.amount + t.taxAmount,
                  type: 'labor' as const,
                })),
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            if (allPayments.length === 0) {
              return <p className="text-sm text-gray-400 py-4 text-center">No payments recorded yet</p>
            }

            return (
              <div className="space-y-2">
                {allPayments.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{t.label}</p>
                        {t.type === 'income' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium">To Owner</span>
                        )}
                        {t.type === 'expense' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">Direct</span>
                        )}
                        {t.type === 'labor' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-medium">Labor</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{format(new Date(t.date), 'dd MMM yyyy')}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">+{formatINR(t.amount)}</span>
                  </div>
                ))}
              </div>
            )
          })()}
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

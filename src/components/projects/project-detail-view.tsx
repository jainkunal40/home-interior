'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn, getStatusColor, getLabelForValue, PROJECT_STATUSES } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SummaryCard } from '@/components/ui/summary-card'
import {
  ArrowLeft,
  BarChart3,
  IndianRupee,
  Wallet,
  Users,
  Flag,
  Paperclip,
  MessageSquare,
  FileText,
  Activity,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import { OverviewTab } from './tabs/overview-tab'
import { IncomeTab } from './tabs/income-tab'
import { ExpensesTab } from './tabs/expenses-tab'
import { LaborTab } from './tabs/labor-tab'
import { MilestonesTab } from './tabs/milestones-tab'
import { AttachmentsTab } from './tabs/attachments-tab'
import { NotesTab } from './tabs/notes-tab'
import { ReportsTab } from './tabs/reports-tab'
import { ActivityTab } from './tabs/activity-tab'
import { MaterialsTab } from './tabs/materials-tab'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'income', label: 'Income', icon: IndianRupee },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'labor', label: 'Labor', icon: Users },
  { id: 'materials', label: 'Materials', icon: Package },
  { id: 'milestones', label: 'Milestones', icon: Flag },
  { id: 'attachments', label: 'Files', icon: Paperclip },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Activity },
] as const

type TabId = (typeof tabs)[number]['id']

export function ProjectDetailView({ project, allVendors, allContractors }: { project: any; allVendors?: any[]; allContractors?: any[] }) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const validTabs = tabs.map(t => t.id) as string[]
  const initialTab = (tabParam && validTabs.includes(tabParam) ? tabParam : 'overview') as TabId
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam as TabId)
    }
  }, [tabParam])

  const totalIncome = project.incomeTransactions.reduce((s: number, t: any) => s + t.amount, 0)
  // Only approved expenses for calculations — exclude labor-linked to avoid double-counting
  const approvedExpenses = project.expenseTransactions.filter((t: any) => t.approvalStatus !== 'pending' && t.approvalStatus !== 'rejected')
  // Total paid across all MaterialEntry payments (tracked separately from ExpenseTransactions)
  const totalMaterialsPaid = (project.materialEntries ?? []).reduce(
    (s: number, e: any) => s + (e.payments ?? []).reduce((ps: number, p: any) => ps + p.amount, 0), 0
  )
  const totalExpenses = approvedExpenses
    .filter((t: any) => !t.laborEntryId)
    .reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0)
    + totalMaterialsPaid
  const totalLabor = project.laborEntries
    .reduce((s: number, t: any) => s + t.totalAmount, 0)
  // Owner-only costs (for P&L) — treat all material payments as owner-paid for now
  const ownerExpenses = approvedExpenses
    .filter((t: any) => !t.paidByClient && !t.laborEntryId)
    .reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0)
    + totalMaterialsPaid
  const ownerLabor = project.laborEntries
    .filter((t: any) => !t.paidByClient)
    .reduce((s: number, t: any) => s + t.totalAmount, 0)
  // Pending approval total
  const pendingApprovalTotal = project.expenseTransactions
    .filter((t: any) => t.approvalStatus === 'pending')
    .reduce((s: number, t: any) => s + t.amount + (t.taxAmount || 0), 0)
  const clientPaidTotal = (totalExpenses - ownerExpenses) + (totalLabor - ownerLabor)
  const netProfit = totalIncome - ownerExpenses - ownerLabor

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard" className="mt-1 p-1.5 rounded-lg hover:bg-dark-100 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-dark-900 truncate">{project.name}</h1>
            <Badge className={getStatusColor(project.status)}>
              {getLabelForValue(PROJECT_STATUSES, project.status)}
            </Badge>
          </div>
          {project.client && (
            <p className="text-sm text-dark-500">{project.client.name}</p>
          )}
          {project.siteAddress && (
            <p className="text-xs text-dark-400">{project.siteAddress}</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <SummaryCard label="Income" value={totalIncome} trend="up" compact />
        <SummaryCard label="Expenses" value={totalExpenses} trend="down" compact />
        <SummaryCard label="Labor" value={totalLabor} trend="down" compact />
        <SummaryCard label="Net Profit" value={netProfit} trend={netProfit >= 0 ? 'up' : 'down'} compact />
      </div>

      {/* Tabs - scrollable with better mobile touch */}
      <div className="border-b border-dark-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-0 overflow-x-auto scrollbar-none -mb-px">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[48px] min-w-[64px] justify-center shrink-0',
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-dark-500 hover:text-dark-700 active:text-dark-900 active:bg-dark-100'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-20 sm:pb-4">
        {activeTab === 'overview' && <OverviewTab project={project} totalIncome={totalIncome} totalExpenses={totalExpenses} totalLabor={totalLabor} netProfit={netProfit} clientPaidTotal={clientPaidTotal} pendingApprovalTotal={pendingApprovalTotal} allVendors={allVendors} allContractors={allContractors} />}
        {activeTab === 'income' && <IncomeTab project={project} />}
        {activeTab === 'expenses' && <ExpensesTab project={project} allVendors={allVendors} allContractors={allContractors} />}
        {activeTab === 'labor' && <LaborTab project={project} allContractors={allContractors} />}
        {activeTab === 'materials' && <MaterialsTab project={project} allVendors={allVendors} />}
        {activeTab === 'milestones' && <MilestonesTab project={project} />}
        {activeTab === 'attachments' && <AttachmentsTab project={project} />}
        {activeTab === 'notes' && <NotesTab project={project} />}
        {activeTab === 'reports' && <ReportsTab project={project} totalIncome={totalIncome} totalExpenses={totalExpenses} totalLabor={totalLabor} netProfit={netProfit} clientPaidTotal={clientPaidTotal} pendingApprovalTotal={pendingApprovalTotal} />}
        {activeTab === 'activity' && <ActivityTab projectId={project.id} />}
      </div>
    </div>
  )
}

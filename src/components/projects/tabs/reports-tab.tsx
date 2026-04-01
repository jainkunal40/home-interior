'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/currency'
import { getLabelForValue, EXPENSE_CATEGORIES, TRADE_TYPES } from '@/lib/utils'
import { Download, TrendingUp, TrendingDown, AlertTriangle, PieChart } from 'lucide-react'

interface ReportsTabProps {
  project: any
  totalIncome: number
  totalExpenses: number
  totalLabor: number
  netProfit: number
  clientPaidTotal?: number
}

export function ReportsTab({ project, totalIncome, totalExpenses, totalLabor, netProfit, clientPaidTotal = 0 }: ReportsTabProps) {
  const totalCost = totalExpenses + totalLabor
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'
  const budgetUsed = project.budget > 0 ? ((totalCost / project.budget) * 100).toFixed(1) : 'N/A'
  const budgetRemaining = project.budget > 0 ? project.budget - totalCost : 0

  // Category breakdown (exclude labor-linked to avoid double-counting)
  const categoryBreakdown: Record<string, number> = {}
  for (const exp of project.expenseTransactions) {
    if (exp.laborEntryId) continue
    const cat = exp.category || 'misc'
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount + (exp.taxAmount || 0)
  }
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])

  // Trade breakdown (all labor entries)
  const tradeBreakdown: Record<string, number> = {}
  for (const l of project.laborEntries) {
    const trade = l.tradeType || 'other'
    tradeBreakdown[trade] = (tradeBreakdown[trade] || 0) + l.totalAmount
  }
  const sortedTrades = Object.entries(tradeBreakdown).sort((a, b) => b[1] - a[1])

  // Pending receivables (project budget or expected - received)
  const pendingReceivable = project.budget > 0 ? Math.max(0, project.budget - totalIncome) : 0

  // Pending payables (worker dues)
  const pendingPayable = project.laborEntries.reduce(
    (s: number, l: any) => s + Math.max(0, l.totalAmount - l.advancePaid), 0
  )

  // Monthly breakdown
  const monthlyIncome: Record<string, number> = {}
  const monthlyExpense: Record<string, number> = {}
  for (const t of project.incomeTransactions) {
    const key = new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    monthlyIncome[key] = (monthlyIncome[key] || 0) + t.amount
  }
  for (const t of project.expenseTransactions) {
    const key = new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    monthlyExpense[key] = (monthlyExpense[key] || 0) + t.amount + (t.taxAmount || 0)
  }
  const allMonths = [...new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])]

  function exportCSV() {
    const rows = [
      ['Explore Interiors — Project Report'],
      ['Project', project.name],
      ['Client', project.client?.name || 'N/A'],
      ['Status', project.status],
      [''],
      ['--- Financial Summary ---'],
      ['Total Income', totalIncome.toString()],
      ['Total Expenses', totalExpenses.toString()],
      ['Total Labor Cost', totalLabor.toString()],
      ...(clientPaidTotal > 0 ? [['Client Paid (excluded from P&L)', clientPaidTotal.toString()]] : []),
      ['Net Profit/Loss', netProfit.toString()],
      ['Profit Margin', `${profitMargin}%`],
      ['Budget', project.budget.toString()],
      ['Budget Used', `${budgetUsed}%`],
      ['Pending Receivables', pendingReceivable.toString()],
      ['Pending Payables', pendingPayable.toString()],
      [''],
      ['--- Expense Breakdown ---'],
      ['Category', 'Amount'],
      ...sortedCategories.map(([cat, amt]) => [getLabelForValue(EXPENSE_CATEGORIES, cat), amt.toString()]),
      [''],
      ['--- Labor Breakdown ---'],
      ['Trade', 'Amount'],
      ...sortedTrades.map(([trade, amt]) => [getLabelForValue(TRADE_TYPES, trade), amt.toString()]),
      [''],
      ['--- Income Transactions ---'],
      ['Date', 'Amount', 'Type', 'Mode', 'From', 'Reference'],
      ...project.incomeTransactions.map((t: any) => [
        new Date(t.date).toLocaleDateString('en-IN'),
        t.amount.toString(),
        t.paymentType,
        t.paymentMode,
        t.receivedFrom || '',
        t.referenceNumber || '',
      ]),
      [''],
      ['--- Expense Transactions ---'],
      ['Date', 'Amount', 'Tax', 'Category', 'Vendor', 'Bill No.'],
      ...project.expenseTransactions.map((t: any) => [
        new Date(t.date).toLocaleDateString('en-IN'),
        t.amount.toString(),
        (t.taxAmount || 0).toString(),
        t.category,
        t.vendorName || '',
        t.billNumber || '',
      ]),
      [''],
      ['--- Labor Entries ---'],
      ['Contractor', 'Trade', 'Rate Type', 'Rate', 'Qty', 'Total', 'Advance', 'Status'],
      ...project.laborEntries.map((l: any) => [
        l.contractor?.name || '',
        l.tradeType,
        l.rateType,
        l.rateAmount.toString(),
        l.quantity.toString(),
        l.totalAmount.toString(),
        l.advancePaid.toString(),
        l.status,
      ]),
    ]

    const csv = rows.map(r => r.map((c: string) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '_')}_Report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Profit & Loss Report
        </h3>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* P&L Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <ReportRow label="Total Income" value={totalIncome} color="text-green-600" icon={<TrendingUp className="w-4 h-4" />} />
            <div className="border-t border-gray-100 pt-2">
              <ReportRow label="Expenses (Materials, Transport, etc.)" value={totalExpenses} color="text-red-600" icon={<TrendingDown className="w-4 h-4" />} indent />
              <ReportRow label="Labor & Contractor Cost" value={totalLabor} color="text-red-600" icon={<TrendingDown className="w-4 h-4" />} indent />
            </div>
            {clientPaidTotal > 0 && (
              <div className="border-t border-gray-100 pt-2">
                <ReportRow label="Client Paid (excluded from P&L)" value={clientPaidTotal} color="text-purple-600" icon={<TrendingDown className="w-4 h-4" />} indent />
              </div>
            )}
            <div className="border-t-2 border-gray-200 pt-2">
              <ReportRow
                label="Net Profit / Loss"
                value={netProfit}
                color={netProfit >= 0 ? 'text-green-700' : 'text-red-700'}
                bold
              />
              <div className="ml-5 mt-1 text-sm text-gray-500">
                Profit margin: <span className={`font-semibold ${Number(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitMargin}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Actual */}
      {project.budget > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Budget vs Actual</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Budget</span>
                <span className="font-semibold">{formatINR(project.budget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Cost (Expenses + Labor)</span>
                <span className="font-semibold">{formatINR(totalCost)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalCost > project.budget ? 'bg-red-500' :
                    totalCost > project.budget * 0.8 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((totalCost / project.budget) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{budgetUsed}% used</span>
                <span className={`font-semibold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {budgetRemaining >= 0 ? `${formatINR(budgetRemaining)} remaining` : `${formatINR(Math.abs(budgetRemaining))} over budget`}
                </span>
              </div>
              {totalCost > project.budget && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Over budget by {formatINR(totalCost - project.budget)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outstanding */}
      {(pendingReceivable > 0 || pendingPayable > 0) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Outstanding</h3>
            <div className="space-y-2">
              {pendingReceivable > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending from Client</span>
                  <span className="font-semibold text-orange-600">{formatINR(pendingReceivable)}</span>
                </div>
              )}
              {pendingPayable > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due to Contractors</span>
                  <span className="font-semibold text-red-600">{formatINR(pendingPayable)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Breakdown */}
      {sortedCategories.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Breakdown by Category</h3>
            <div className="space-y-2">
              {sortedCategories.map(([cat, amount]) => {
                const percent = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{getLabelForValue(EXPENSE_CATEGORIES, cat)}</span>
                      <span className="font-medium tabular-nums">{formatINR(amount)} ({percent}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labor Breakdown */}
      {sortedTrades.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Labor Cost by Trade</h3>
            <div className="space-y-2">
              {sortedTrades.map(([trade, amount]) => {
                const percent = totalLabor > 0 ? Math.round((amount / totalLabor) * 100) : 0
                return (
                  <div key={trade}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{getLabelForValue(TRADE_TYPES, trade)}</span>
                      <span className="font-medium tabular-nums">{formatINR(amount)} ({percent}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Cashflow */}
      {allMonths.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Cashflow</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Month</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Income</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Expenses</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {allMonths.map((month) => {
                    const inc = monthlyIncome[month] || 0
                    const exp = monthlyExpense[month] || 0
                    const net = inc - exp
                    return (
                      <tr key={month} className="border-b border-gray-50">
                        <td className="py-2 text-gray-700">{month}</td>
                        <td className="py-2 text-right text-green-600 tabular-nums">{formatINR(inc)}</td>
                        <td className="py-2 text-right text-red-600 tabular-nums">{formatINR(exp)}</td>
                        <td className={`py-2 text-right font-medium tabular-nums ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatINR(net)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ReportRow({
  label,
  value,
  color,
  bold,
  icon,
  indent,
}: {
  label: string
  value: number
  color: string
  bold?: boolean
  icon?: React.ReactNode
  indent?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${indent ? 'ml-5' : ''}`}>
      <div className="flex items-center gap-2">
        {icon && <span className={color}>{icon}</span>}
        <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      </div>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold text-base' : 'font-medium'} ${color}`}>
        {formatINR(Math.abs(value))}
      </span>
    </div>
  )
}

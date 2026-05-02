'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatINR } from '@/lib/currency'
import { format } from 'date-fns'

export function LedgerTab({ project }: { project: any }) {
  const vendorRows = new Map<string, any>()
  const addVendor = (name: string, billed: number, paid: number, date?: Date | string) => {
    const row = vendorRows.get(name) || { name, billed: 0, paid: 0, entries: [] }
    row.billed += billed
    row.paid += paid
    row.entries.push({ billed, paid, date })
    vendorRows.set(name, row)
  }

  for (const entry of (project.materialEntries ?? [])) {
    const paid = (entry.payments ?? []).reduce((s: number, p: any) => s + p.amount, 0)
    addVendor(entry.vendor?.name || entry.vendorName || 'Unknown Vendor', entry.billAmount, paid, entry.billDate)
  }
  for (const exp of (project.expenseTransactions ?? [])) {
    if (exp.laborEntryId || exp.approvalStatus === 'rejected') continue
    addVendor(exp.vendor?.name || exp.vendorName || 'Misc Vendor', exp.amount + (exp.taxAmount || 0), exp.amount + (exp.taxAmount || 0), exp.date)
  }

  const contractorRows = (project.laborEntries ?? []).map((l: any) => ({
    name: l.contractor?.name || l.tradeType,
    billed: l.totalAmount,
    paid: l.advancePaid,
    date: l.endDate || l.startDate,
  }))

  return (
    <div className="space-y-4">
      <LedgerSection title="Vendor Ledger" rows={[...vendorRows.values()]} type="Vendor" />
      <LedgerSection title="Contractor Ledger" rows={contractorRows} type="Contractor" />
    </div>
  )
}

function LedgerSection({ title, rows, type }: { title: string; rows: any[]; type: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">No ledger entries yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => {
              const pending = Math.max(0, row.billed - row.paid)
              return (
                <div key={`${row.name}-${index}`} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{row.name}</p>
                        <Badge className="bg-gray-50 text-gray-700">{type}</Badge>
                      </div>
                      {row.date && <p className="text-xs text-gray-400 mt-1">Latest: {format(new Date(row.date), 'dd MMM yyyy')}</p>}
                    </div>
                    <p className={`font-bold tabular-nums ${pending > 0 ? 'text-orange-600' : 'text-green-600'}`}>{formatINR(pending)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-500">
                    <span>Billed: {formatINR(row.billed)}</span>
                    <span>Paid: {formatINR(row.paid)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

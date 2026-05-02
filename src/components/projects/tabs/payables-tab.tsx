'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatINR } from '@/lib/currency'
import { format, differenceInCalendarDays } from 'date-fns'

export function PayablesTab({ project }: { project: any }) {
  const rows = [
    ...(project.materialEntries ?? []).map((entry: any) => {
      const paid = (entry.payments ?? []).reduce((s: number, p: any) => s + p.amount, 0)
      const due = Math.max(0, entry.billAmount - paid)
      return due > 0 ? {
        id: `material-${entry.id}`,
        type: 'Material',
        name: entry.description,
        party: entry.vendor?.name || entry.vendorName || 'Vendor',
        due,
        date: entry.billDate,
      } : null
    }),
    ...(project.laborEntries ?? []).map((labor: any) => {
      const due = Math.max(0, labor.totalAmount - labor.advancePaid)
      return due > 0 ? {
        id: `labor-${labor.id}`,
        type: 'Labor',
        name: labor.contractor?.name || labor.tradeType,
        party: labor.contractor?.name || 'Contractor',
        due,
        date: labor.endDate || labor.startDate,
      } : null
    }),
  ].filter(Boolean).sort((a: any, b: any) => b.due - a.due)

  const totalDue = rows.reduce((s: number, r: any) => s + r.due, 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-gray-500">Total Payables</p>
          <p className="text-2xl font-bold text-orange-600 tabular-nums">{formatINR(totalDue)}</p>
        </CardContent>
      </Card>
      {rows.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-gray-400">No unpaid material bills or labor dues.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row: any) => <PayableRow key={row.id} row={row} />)}
        </div>
      )}
    </div>
  )
}

function PayableRow({ row }: { row: any }) {
  const age = row.date ? differenceInCalendarDays(new Date(), new Date(row.date)) : 999
  const priority = age > 30 ? 'High' : age > 14 ? 'Medium' : 'Normal'
  const color = priority === 'High' ? 'bg-red-50 text-red-700' : priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex gap-2 flex-wrap items-center">
            <p className="font-semibold text-gray-900 truncate">{row.name}</p>
            <Badge className="bg-blue-50 text-blue-700">{row.type}</Badge>
            <Badge className={color}>{priority}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">{row.party}{row.date ? ` · ${format(new Date(row.date), 'dd MMM yyyy')}` : ' · No due date'}</p>
        </div>
        <p className="font-bold text-orange-600 tabular-nums shrink-0">{formatINR(row.due)}</p>
      </CardContent>
    </Card>
  )
}

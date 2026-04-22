import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(',')),
  ]
  return lines.join('\r\n')
}

function fmtDate(d: Date | string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const projectId = searchParams.get('projectId')
  const type = searchParams.get('type') as 'expenses' | 'income' | 'labor' | null

  if (!projectId || !type) {
    return NextResponse.json({ error: 'Missing projectId or type' }, { status: 400 })
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true, name: true },
  })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  let csv = ''
  const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${type}`

  if (type === 'expenses') {
    const rows = await prisma.expenseTransaction.findMany({
      where: { projectId, approvalStatus: { not: 'rejected' } },
      include: { vendor: { select: { name: true } } },
      orderBy: { date: 'asc' },
    })
    csv = toCSV(rows.map(r => ({
      Date: fmtDate(r.date),
      Category: r.category,
      Amount: r.amount,
      'Tax Amount': r.taxAmount,
      'Total': r.amount + r.taxAmount,
      'Vendor': r.vendor?.name || r.vendorName || '',
      'Payment Mode': r.paymentMode,
      'Paid By Client': r.paidByClient ? 'Yes' : 'No',
      'Status': r.approvalStatus,
      'Bill No': r.billNumber || '',
      Notes: r.notes || '',
    })))
  } else if (type === 'income') {
    const rows = await prisma.incomeTransaction.findMany({
      where: { projectId },
      orderBy: { date: 'asc' },
    })
    csv = toCSV(rows.map(r => ({
      Date: fmtDate(r.date),
      Amount: r.amount,
      'Payment Type': r.paymentType,
      'Payment Mode': r.paymentMode,
      'Received From': r.receivedFrom || '',
      'Reference No': r.referenceNumber || '',
      Notes: r.notes || '',
    })))
  } else if (type === 'labor') {
    const rows = await prisma.laborEntry.findMany({
      where: { projectId },
      include: { contractor: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    })
    csv = toCSV(rows.map(r => ({
      Contractor: r.contractor?.name ?? '',
      Trade: r.tradeType,
      'Rate Type': r.rateType,
      'Rate (₹)': r.rateAmount,
      Quantity: r.quantity,
      'Total Amount': r.totalAmount,
      'Advance Paid': r.advancePaid,
      Status: r.status,
      'Paid By Client': r.paidByClient ? 'Yes' : 'No',
      'Start Date': fmtDate(r.startDate),
      'End Date': fmtDate(r.endDate),
      Notes: r.notes || '',
    })))
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}

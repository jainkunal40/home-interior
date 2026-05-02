import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function money(n: number) {
  return `INR ${Math.round(n).toLocaleString('en-IN')}`
}

function escPdf(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdf(lines: string[]) {
  const content = [
    'BT',
    '/F1 12 Tf',
    '50 790 Td',
    ...lines.flatMap((line, index) => [
      index === 0 ? '/F1 18 Tf' : '/F1 11 Tf',
      index === 1 ? '0 -26 Td' : index > 1 ? '0 -17 Td' : '',
      `(${escPdf(line)}) Tj`,
    ]).filter(Boolean),
    'ET',
  ].join('\n')

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${obj}\n`
  }
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return pdf
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      client: true,
      incomeTransactions: true,
      expenseTransactions: { where: { approvalStatus: 'approved' } },
      laborEntries: true,
      materialEntries: { include: { payments: true } },
      milestones: true,
    },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const paidToOwner = project.incomeTransactions.reduce((s, t) => s + t.amount, 0)
  const clientPaidExpenses = project.expenseTransactions.filter(t => t.paidByClient).reduce((s, t) => s + t.amount + t.taxAmount, 0)
  const materialPayments = project.materialEntries.reduce((s, e) => s + e.payments.reduce((ps, p) => ps + p.amount, 0), 0)
  const clientMaterialPayments = project.materialEntries.filter(e => e.paidByClient).reduce((s, e) => s + e.payments.reduce((ps, p) => ps + p.amount, 0), 0)
  const milestoneText = `${project.milestones.filter(m => m.status === 'completed').length}/${project.milestones.length} completed`
  const totalClientPaid = paidToOwner + clientPaidExpenses + clientMaterialPayments
  const balance = project.budget - totalClientPaid

  const lines = [
    `${project.name} - Client Statement`,
    `Client: ${project.client?.name || 'N/A'}`,
    `Budget: ${money(project.budget)}`,
    `Payments received by owner: ${money(paidToOwner)}`,
    `Client-paid approved expenses: ${money(clientPaidExpenses)}`,
    `Material payments recorded: ${money(materialPayments)}`,
    `Client-paid material payments: ${money(clientMaterialPayments)}`,
    `Total counted as paid by client: ${money(totalClientPaid)}`,
    `Balance against budget: ${money(balance)}`,
    `Milestones: ${milestoneText}`,
    '',
    'Generated from Explore Interiors.',
  ]

  const pdf = buildPdf(lines)
  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}_statement.pdf"`,
    },
  })
}

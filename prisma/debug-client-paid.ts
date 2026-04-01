import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const pid = 'cmnfkhqdj00027tbjkcya58nq'

  const exps = await prisma.expenseTransaction.findMany({
    where: { projectId: pid },
    select: { id: true, amount: true, taxAmount: true, paidByClient: true, category: true, vendorName: true, laborEntryId: true },
  })

  // Standalone expenses (not linked to labor)
  const standaloneExp = exps.filter(e => !e.laborEntryId)
  const laborLinkedExp = exps.filter(e => e.laborEntryId)

  console.log('=== EXPENSES ===')
  console.log('Total:', exps.length, '| Standalone:', standaloneExp.length, '| Labor-linked:', laborLinkedExp.length)

  const ownerStandalone = standaloneExp.filter(e => !e.paidByClient)
  const clientStandalone = standaloneExp.filter(e => e.paidByClient)
  console.log('Owner standalone expenses:', ownerStandalone.reduce((s, e) => s + e.amount + (e.taxAmount || 0), 0))
  console.log('Client standalone expenses:', clientStandalone.reduce((s, e) => s + e.amount + (e.taxAmount || 0), 0))

  const labs = await prisma.laborEntry.findMany({
    where: { projectId: pid },
    include: { contractor: { select: { name: true } } },
  })
  const ownerLabor = labs.filter((l: any) => !l.paidByClient)
  const clientLabor = labs.filter((l: any) => l.paidByClient)
  console.log('\n=== LABOR ===')
  console.log('Owner labor total:', ownerLabor.reduce((s: number, l: any) => s + l.totalAmount, 0))
  console.log('Client labor total:', clientLabor.reduce((s: number, l: any) => s + l.totalAmount, 0))

  // Corrected totals
  const totalExpenses = ownerStandalone.reduce((s, e) => s + e.amount + (e.taxAmount || 0), 0)
  const totalLabor = ownerLabor.reduce((s: number, l: any) => s + l.totalAmount, 0)
  const clientPaidTotal = clientStandalone.reduce((s, e) => s + e.amount + (e.taxAmount || 0), 0)
    + clientLabor.reduce((s: number, l: any) => s + l.totalAmount, 0)

  console.log('\n=== CORRECTED P&L ===')
  console.log('totalExpenses (owner, non-labor-linked):', totalExpenses)
  console.log('totalLabor (owner):', totalLabor)
  console.log('Client Paid (excluded):', clientPaidTotal)
}

main().catch(console.error).finally(() => prisma.$disconnect())

/**
 * One-time migration: material-category ExpenseTransactions → MaterialEntry + MaterialPayment
 *
 * Run with:  npx tsx prisma/migrate-materials.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MATERIAL_CATS = ['materials', 'hardware', 'furnishing']

async function main() {
  console.log('🔍 Finding material-category expense transactions...')

  const expenses = await prisma.expenseTransaction.findMany({
    where: {
      category: { in: MATERIAL_CATS },
      approvalStatus: { not: 'rejected' },
    },
    include: { attachments: { select: { id: true } } },
  })

  console.log(`   Found ${expenses.length} expense(s) to migrate.`)

  if (expenses.length === 0) {
    console.log('✅ Nothing to migrate.')
    return
  }

  let migrated = 0
  let skipped = 0

  for (const exp of expenses) {
    if (exp.attachments.length > 0) {
      console.log(`   ⚠️  Skipping expense ${exp.id} — has ${exp.attachments.length} attachment(s). Move attachments first.`)
      skipped++
      continue
    }

    const billAmount = exp.amount + (exp.taxAmount ?? 0)
    const description = exp.vendorName
      ? `${exp.vendorName}${exp.billNumber ? ` — Bill #${exp.billNumber}` : ''}`
      : `${exp.category} expense${exp.billNumber ? ` — Bill #${exp.billNumber}` : ''}`

    const entry = await prisma.materialEntry.create({
      data: {
        description,
        category: exp.category,
        vendorName: exp.vendorName ?? null,
        vendorId: exp.vendorId ?? null,
        billNumber: exp.billNumber ?? null,
        billDate: exp.date,
        billAmount,
        notes: exp.notes ?? null,
        phaseId: exp.phaseId ?? null,
        projectId: exp.projectId,
      },
    })

    await prisma.materialPayment.create({
      data: {
        amount: billAmount,
        date: exp.date,
        paymentMode: exp.paymentMode ?? 'cash',
        materialEntryId: entry.id,
      },
    })

    await prisma.expenseTransaction.delete({ where: { id: exp.id } })

    console.log(`   ✅ Migrated: ${description} (₹${billAmount}) → MaterialEntry ${entry.id}`)
    migrated++
  }

  console.log(`\n🎉 Done. Migrated: ${migrated}, Skipped: ${skipped}`)
}

main()
  .catch((e) => { console.error('❌ Migration failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

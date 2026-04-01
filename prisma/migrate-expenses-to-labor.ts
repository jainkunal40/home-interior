import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * One-time migration: For existing labor/subcontractor expenses that have no
 * linked LaborEntry, auto-create a LaborEntry and link it.
 *
 * Groups expenses by (projectId + vendorName) so one LaborEntry is created per
 * contractor per project, and all related expenses are linked as payments.
 */
async function main() {
  console.log('🔄 Migrating unlinked labor/subcontractor expenses...\n')

  // Find all labor/subcontractor expenses that have no laborEntryId
  const unlinked = await prisma.expenseTransaction.findMany({
    where: {
      category: { in: ['labor', 'subcontractor'] },
      laborEntryId: null,
    },
    orderBy: { date: 'asc' },
  })

  if (unlinked.length === 0) {
    console.log('✅ No unlinked labor/subcontractor expenses found. Nothing to migrate.')
    return
  }

  console.log(`Found ${unlinked.length} unlinked expense(s). Grouping by project + contractor...\n`)

  // Group by projectId + vendorName (case-insensitive)
  const groups = new Map<string, typeof unlinked>()
  for (const exp of unlinked) {
    const name = (exp.vendorName || 'Unknown Contractor').trim().toLowerCase()
    const key = `${exp.projectId}::${name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(exp)
  }

  let createdCount = 0
  let linkedCount = 0

  for (const [key, expenses] of groups) {
    const [projectId, nameLower] = key.split('::')
    const displayName = expenses[0].vendorName || 'Unknown Contractor'

    // Check if there's already a LaborEntry for this contractor in this project
    // Try to match by contractor name
    const existingEntry = await prisma.laborEntry.findFirst({
      where: {
        projectId,
        contractor: { name: { equals: displayName, mode: 'insensitive' } },
      },
    })

    let laborEntryId: string

    if (existingEntry) {
      laborEntryId = existingEntry.id
      console.log(`  ↳ Reusing existing LaborEntry for "${displayName}" in project ${projectId.slice(0, 8)}...`)
    } else {
      // Try to find an existing Contractor record by name
      let contractor = await prisma.contractor.findFirst({
        where: { name: { equals: displayName, mode: 'insensitive' } },
      })

      // Create contractor if not found
      if (!contractor) {
        contractor = await prisma.contractor.create({
          data: {
            name: displayName,
            trade: expenses[0].category === 'subcontractor' ? 'subcontractor' : 'other',
          },
        })
        console.log(`  + Created Contractor "${displayName}"`)
      }

      // Sum up all expenses to set as totalAmount
      const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
      const earliestDate = expenses[0].date

      const entry = await prisma.laborEntry.create({
        data: {
          tradeType: contractor.trade || 'other',
          rateType: 'fixed',
          rateAmount: totalAmount,
          quantity: 1,
          totalAmount,
          advancePaid: 0,
          status: 'ongoing',
          startDate: earliestDate,
          contractorId: contractor.id,
          projectId,
        },
      })
      laborEntryId = entry.id
      createdCount++
      console.log(`  + Created LaborEntry for "${displayName}" (₹${totalAmount}) in project ${projectId.slice(0, 8)}...`)
    }

    // Link all expenses to this labor entry
    const ids = expenses.map((e) => e.id)
    await prisma.expenseTransaction.updateMany({
      where: { id: { in: ids } },
      data: { laborEntryId },
    })
    linkedCount += ids.length

    // Recalculate advancePaid on the labor entry
    const totalPaid = await prisma.expenseTransaction.aggregate({
      where: { laborEntryId },
      _sum: { amount: true },
    })
    await prisma.laborEntry.update({
      where: { id: laborEntryId },
      data: { advancePaid: totalPaid._sum.amount || 0 },
    })
  }

  console.log(`\n✅ Migration complete:`)
  console.log(`   ${createdCount} LaborEntry record(s) created`)
  console.log(`   ${linkedCount} expense(s) linked`)
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

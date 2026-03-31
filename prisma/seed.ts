import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Explore Interiors...')

  // Clean up
  await prisma.activityLog.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.note.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.laborEntry.deleteMany()
  await prisma.expenseTransaction.deleteMany()
  await prisma.incomeTransaction.deleteMany()
  await prisma.projectPhase.deleteMany()
  await prisma.project.deleteMany()
  await prisma.contractor.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 12)
  const user = await prisma.user.create({
    data: {
      name: 'Ratandeep Bora',
      email: 'ratandeep@exploreinteriors.app',
      passwordHash,
      role: 'owner',
    },
  })
  console.log('✅ User: ratandeep@exploreinteriors.app / demo123')

  // Create a client login user
  const clientUser = await prisma.user.create({
    data: {
      name: 'Rajesh Patel',
      email: 'rajesh@exploreinteriors.app',
      passwordHash,
      role: 'client',
    },
  })
  console.log('✅ Client user: rajesh@exploreinteriors.app / demo123')

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Mr. Rajesh Patel',
      phone: '+91 98765 43210',
      email: 'rajesh.patel@exploreinteriors.app',
      address: 'A-201, Green Valley Apartments, Baner, Pune',
      userId: clientUser.id,
    },
  })
  const client2 = await prisma.client.create({
    data: {
      name: 'Ms. Ananya Reddy',
      phone: '+91 99887 76655',
      email: 'ananya.r@exploreinteriors.app',
      address: '12, Palm Springs Villa, Whitefield, Bangalore',
    },
  })
  const client3 = await prisma.client.create({
    data: {
      name: 'Dr. Vikram Singh',
      phone: '+91 87654 32109',
      email: 'vikram.singh@exploreinteriors.app',
      address: '305, Skyline Tower, Noida Sector 62',
    },
  })

  // Create vendors
  const vendor1 = await prisma.vendor.create({
    data: { name: 'Shree Timber Works', phone: '+91 97654 12300', category: 'materials', gstNumber: '27AAACS1234F1ZP' },
  })
  const vendor2 = await prisma.vendor.create({
    data: { name: 'Ganesh Hardware', phone: '+91 98123 45678', category: 'hardware' },
  })
  const vendor3 = await prisma.vendor.create({
    data: { name: 'Modern Furnishing Co.', phone: '+91 91234 56789', category: 'furnishing' },
  })

  // Create contractors
  const contractor1 = await prisma.contractor.create({
    data: { name: 'Ramesh Vishwakarma', phone: '+91 96543 21098', trade: 'carpenter' },
  })
  const contractor2 = await prisma.contractor.create({
    data: { name: 'Suresh Electricals', phone: '+91 95432 10987', trade: 'electrician' },
  })
  const contractor3 = await prisma.contractor.create({
    data: { name: 'Vijay Painters', phone: '+91 94321 09876', trade: 'painter' },
  })
  const contractor4 = await prisma.contractor.create({
    data: { name: 'Akash Plumbing', phone: '+91 93210 98765', trade: 'plumber' },
  })

  // ─── Project 1: Active 3BHK ────────────────────────────

  const project1 = await prisma.project.create({
    data: {
      name: '3BHK Interior — Green Valley',
      description: 'Complete interior design for a 3BHK flat including modular kitchen, wardrobes, false ceiling, electrical and painting.',
      siteAddress: 'A-201, Green Valley Apartments, Baner, Pune 411045',
      status: 'active',
      budget: 1800000,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-05-30'),
      userId: user.id,
      clientId: client1.id,
    },
  })

  // Phases
  const phases1 = await Promise.all(
    ['Design', 'Demolition', 'Civil', 'Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Furnishing', 'Handover'].map(
      (name, i) =>
        prisma.projectPhase.create({
          data: {
            name,
            sortOrder: i,
            projectId: project1.id,
            status: i < 3 ? 'completed' : i < 5 ? 'in_progress' : 'pending',
            budget: [100000, 50000, 200000, 150000, 80000, 500000, 120000, 400000, 0][i],
          },
        })
    )
  )

  // Income for project 1
  await prisma.incomeTransaction.createMany({
    data: [
      {
        date: new Date('2026-01-10'),
        amount: 500000,
        paymentType: 'advance',
        paymentMode: 'bank_transfer',
        receivedFrom: 'Mr. Rajesh Patel',
        referenceNumber: 'NEFT-20260110-001',
        notes: 'Initial advance — 25% of total',
        projectId: project1.id,
        phaseId: phases1[0].id,
      },
      {
        date: new Date('2026-02-15'),
        amount: 400000,
        paymentType: 'milestone_payment',
        paymentMode: 'upi',
        receivedFrom: 'Mr. Rajesh Patel',
        referenceNumber: 'UPI-9876543210@ybl',
        notes: 'After civil work completion',
        projectId: project1.id,
        phaseId: phases1[2].id,
      },
      {
        date: new Date('2026-03-10'),
        amount: 300000,
        paymentType: 'milestone_payment',
        paymentMode: 'cheque',
        receivedFrom: 'Mr. Rajesh Patel',
        referenceNumber: 'CHQ-445566',
        notes: 'Carpentry material advance',
        projectId: project1.id,
        phaseId: phases1[5].id,
      },
    ],
  })

  // Expenses for project 1
  await prisma.expenseTransaction.createMany({
    data: [
      {
        date: new Date('2026-01-20'),
        amount: 45000,
        category: 'materials',
        vendorName: 'Shree Timber Works',
        paymentMode: 'bank_transfer',
        taxAmount: 8100,
        gstPercent: 18,
        billNumber: 'STW-2026-001',
        notes: 'Plywood and laminates for kitchen',
        projectId: project1.id,
        vendorId: vendor1.id,
        phaseId: phases1[5].id,
      },
      {
        date: new Date('2026-01-25'),
        amount: 28000,
        category: 'materials',
        vendorName: 'Ganesh Hardware',
        paymentMode: 'upi',
        taxAmount: 5040,
        gstPercent: 18,
        billNumber: 'GH-0234',
        notes: 'Wires, switches, MCBs',
        projectId: project1.id,
        vendorId: vendor2.id,
        phaseId: phases1[3].id,
      },
      {
        date: new Date('2026-02-05'),
        amount: 120000,
        category: 'materials',
        vendorName: 'Shree Timber Works',
        paymentMode: 'bank_transfer',
        taxAmount: 21600,
        gstPercent: 18,
        billNumber: 'STW-2026-002',
        notes: 'Marine plywood, hinges, channels',
        projectId: project1.id,
        vendorId: vendor1.id,
        phaseId: phases1[5].id,
      },
      {
        date: new Date('2026-02-10'),
        amount: 35000,
        category: 'transport',
        vendorName: 'Local Goods Transport',
        paymentMode: 'cash',
        notes: 'Material delivery — multiple trips',
        projectId: project1.id,
        phaseId: phases1[2].id,
      },
      {
        date: new Date('2026-02-20'),
        amount: 15000,
        category: 'site_expense',
        paymentMode: 'cash',
        notes: 'Site cleaning, waste disposal',
        projectId: project1.id,
        phaseId: phases1[1].id,
      },
      {
        date: new Date('2026-03-01'),
        amount: 65000,
        category: 'furnishing',
        vendorName: 'Modern Furnishing Co.',
        paymentMode: 'bank_transfer',
        taxAmount: 11700,
        gstPercent: 18,
        billNumber: 'MFC-1098',
        notes: 'Curtains, blinds, soft furnishings',
        projectId: project1.id,
        vendorId: vendor3.id,
        phaseId: phases1[7].id,
      },
      {
        date: new Date('2026-03-15'),
        amount: 22000,
        category: 'hardware',
        vendorName: 'Ganesh Hardware',
        paymentMode: 'upi',
        taxAmount: 3960,
        gstPercent: 18,
        billNumber: 'GH-0289',
        notes: 'Kitchen accessories, handles, profiles',
        projectId: project1.id,
        vendorId: vendor2.id,
        phaseId: phases1[5].id,
      },
      {
        date: new Date('2026-03-20'),
        amount: 18000,
        category: 'utility',
        paymentMode: 'cash',
        notes: 'Site electricity, water charges for 3 months',
        projectId: project1.id,
      },
    ],
  })

  // Labor entries for project 1
  await prisma.laborEntry.createMany({
    data: [
      {
        tradeType: 'carpenter',
        rateType: 'per_sqft',
        rateAmount: 220,
        quantity: 850,
        totalAmount: 187000,
        advancePaid: 100000,
        startDate: new Date('2026-02-01'),
        status: 'ongoing',
        notes: 'Modular kitchen + all wardrobes',
        projectId: project1.id,
        contractorId: contractor1.id,
        phaseId: phases1[5].id,
      },
      {
        tradeType: 'electrician',
        rateType: 'fixed',
        rateAmount: 85000,
        quantity: 1,
        totalAmount: 85000,
        advancePaid: 40000,
        startDate: new Date('2026-01-25'),
        status: 'completed',
        notes: 'Complete electrical work — wiring, points, panel',
        projectId: project1.id,
        contractorId: contractor2.id,
        phaseId: phases1[3].id,
      },
      {
        tradeType: 'painter',
        rateType: 'per_sqft',
        rateAmount: 28,
        quantity: 2200,
        totalAmount: 61600,
        advancePaid: 0,
        status: 'pending_payment',
        notes: 'Asian Paints — Royale Luxury Emulsion',
        projectId: project1.id,
        contractorId: contractor3.id,
        phaseId: phases1[6].id,
      },
      {
        tradeType: 'plumber',
        rateType: 'fixed',
        rateAmount: 45000,
        quantity: 1,
        totalAmount: 45000,
        advancePaid: 25000,
        startDate: new Date('2026-01-28'),
        status: 'completed',
        notes: 'Full plumbing — bathroom fittings, kitchen',
        projectId: project1.id,
        contractorId: contractor4.id,
        phaseId: phases1[4].id,
      },
      {
        tradeType: 'false_ceiling',
        rateType: 'per_sqft',
        rateAmount: 75,
        quantity: 600,
        totalAmount: 45000,
        advancePaid: 20000,
        startDate: new Date('2026-02-15'),
        status: 'ongoing',
        notes: 'Gypsum false ceiling — living + bedrooms',
        projectId: project1.id,
        phaseId: phases1[5].id,
      },
    ],
  })

  // Milestones for project 1
  await prisma.milestone.createMany({
    data: [
      { title: 'Design finalization & client approval', status: 'completed', dueDate: new Date('2026-01-20'), completionDate: new Date('2026-01-18'), projectId: project1.id, phaseId: phases1[0].id },
      { title: 'Demolition complete', status: 'completed', dueDate: new Date('2026-01-30'), completionDate: new Date('2026-01-29'), projectId: project1.id, phaseId: phases1[1].id },
      { title: 'Civil & masonry done', status: 'completed', dueDate: new Date('2026-02-15'), completionDate: new Date('2026-02-14'), projectId: project1.id, phaseId: phases1[2].id },
      { title: 'Electrical rough wiring complete', status: 'completed', dueDate: new Date('2026-02-28'), completionDate: new Date('2026-02-26'), projectId: project1.id, phaseId: phases1[3].id },
      { title: 'Kitchen modular installation', status: 'in_progress', dueDate: new Date('2026-04-10'), projectId: project1.id, phaseId: phases1[5].id },
      { title: 'Painting complete', status: 'pending', dueDate: new Date('2026-04-25'), projectId: project1.id, phaseId: phases1[6].id },
      { title: 'Final handover', status: 'pending', dueDate: new Date('2026-05-30'), projectId: project1.id, phaseId: phases1[8].id },
    ],
  })

  // Notes for project 1
  await prisma.note.createMany({
    data: [
      { content: 'Client prefers warm-toned laminates for kitchen. Avoid pure white.', projectId: project1.id },
      { content: 'Bathroom tiles selected — RAK Ceramics 600x1200mm. Order confirmed.', projectId: project1.id },
      { content: 'Living room false ceiling pattern changed to cove + profile lighting.', projectId: project1.id },
    ],
  })

  // ─── Project 2: Completed Villa ─────────────────────────

  const project2 = await prisma.project.create({
    data: {
      name: 'Palm Springs Villa — Full Interior',
      description: 'Premium villa interior — 4BHK with home theater, modular kitchen, and landscape lighting.',
      siteAddress: '12, Palm Springs Villa, Whitefield, Bangalore 560066',
      status: 'completed',
      budget: 3500000,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-12-15'),
      userId: user.id,
      clientId: client2.id,
    },
  })

  const phases2 = await Promise.all(
    ['Design', 'Demolition', 'Civil', 'Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Furnishing', 'Handover'].map(
      (name, i) =>
        prisma.projectPhase.create({
          data: {
            name,
            sortOrder: i,
            projectId: project2.id,
            status: 'completed',
            budget: [200000, 80000, 400000, 300000, 150000, 1000000, 250000, 800000, 0][i],
          },
        })
    )
  )

  await prisma.incomeTransaction.createMany({
    data: [
      { date: new Date('2025-05-25'), amount: 1000000, paymentType: 'advance', paymentMode: 'bank_transfer', receivedFrom: 'Ms. Ananya Reddy', projectId: project2.id },
      { date: new Date('2025-08-10'), amount: 800000, paymentType: 'milestone_payment', paymentMode: 'bank_transfer', receivedFrom: 'Ms. Ananya Reddy', projectId: project2.id },
      { date: new Date('2025-10-15'), amount: 1000000, paymentType: 'milestone_payment', paymentMode: 'upi', receivedFrom: 'Ms. Ananya Reddy', projectId: project2.id },
      { date: new Date('2025-12-20'), amount: 700000, paymentType: 'final_payment', paymentMode: 'bank_transfer', receivedFrom: 'Ms. Ananya Reddy', projectId: project2.id },
    ],
  })

  await prisma.expenseTransaction.createMany({
    data: [
      { date: new Date('2025-06-15'), amount: 350000, category: 'materials', vendorName: 'Shree Timber Works', paymentMode: 'bank_transfer', taxAmount: 63000, projectId: project2.id, vendorId: vendor1.id, phaseId: phases2[5].id },
      { date: new Date('2025-07-01'), amount: 180000, category: 'materials', vendorName: 'Ganesh Hardware', paymentMode: 'bank_transfer', taxAmount: 32400, projectId: project2.id, vendorId: vendor2.id },
      { date: new Date('2025-08-01'), amount: 220000, category: 'furnishing', vendorName: 'Modern Furnishing Co.', paymentMode: 'bank_transfer', taxAmount: 39600, projectId: project2.id, vendorId: vendor3.id, phaseId: phases2[7].id },
      { date: new Date('2025-09-01'), amount: 95000, category: 'transport', paymentMode: 'cash', projectId: project2.id },
      { date: new Date('2025-10-01'), amount: 45000, category: 'site_expense', paymentMode: 'cash', projectId: project2.id },
      { date: new Date('2025-11-01'), amount: 120000, category: 'hardware', vendorName: 'Ganesh Hardware', paymentMode: 'upi', taxAmount: 21600, projectId: project2.id, vendorId: vendor2.id },
    ],
  })

  await prisma.laborEntry.createMany({
    data: [
      { tradeType: 'carpenter', rateType: 'per_sqft', rateAmount: 250, quantity: 1800, totalAmount: 450000, advancePaid: 450000, status: 'completed', projectId: project2.id, contractorId: contractor1.id, phaseId: phases2[5].id },
      { tradeType: 'electrician', rateType: 'fixed', rateAmount: 180000, quantity: 1, totalAmount: 180000, advancePaid: 180000, status: 'completed', projectId: project2.id, contractorId: contractor2.id, phaseId: phases2[3].id },
      { tradeType: 'painter', rateType: 'per_sqft', rateAmount: 32, quantity: 4500, totalAmount: 144000, advancePaid: 144000, status: 'completed', projectId: project2.id, contractorId: contractor3.id, phaseId: phases2[6].id },
      { tradeType: 'plumber', rateType: 'fixed', rateAmount: 95000, quantity: 1, totalAmount: 95000, advancePaid: 95000, status: 'completed', projectId: project2.id, contractorId: contractor4.id, phaseId: phases2[4].id },
    ],
  })

  // ─── Project 3: Planning stage ──────────────────────────

  const project3 = await prisma.project.create({
    data: {
      name: '2BHK Renovation — Skyline Tower',
      description: 'Budget-friendly renovation of a 2BHK flat. Focus on kitchen remodel and fresh painting.',
      siteAddress: '305, Skyline Tower, Noida Sector 62',
      status: 'planning',
      budget: 650000,
      startDate: new Date('2026-04-15'),
      userId: user.id,
      clientId: client3.id,
    },
  })

  await Promise.all(
    ['Design', 'Demolition', 'Civil', 'Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Furnishing', 'Handover'].map(
      (name, i) =>
        prisma.projectPhase.create({
          data: { name, sortOrder: i, projectId: project3.id, status: 'pending' },
        })
    )
  )

  await prisma.incomeTransaction.create({
    data: {
      date: new Date('2026-03-28'),
      amount: 150000,
      paymentType: 'advance',
      paymentMode: 'upi',
      receivedFrom: 'Dr. Vikram Singh',
      referenceNumber: 'UPI-VIKSINGH@sbi',
      notes: 'Booking advance',
      projectId: project3.id,
    },
  })

  await prisma.note.create({
    data: {
      content: 'Client wants a modular kitchen with chimney. Budget is tight — suggest laminate finish over acrylic.',
      projectId: project3.id,
    },
  })

  await prisma.milestone.createMany({
    data: [
      { title: 'Site visit & measurements', status: 'completed', dueDate: new Date('2026-03-25'), completionDate: new Date('2026-03-24'), projectId: project3.id },
      { title: 'Design presentation', status: 'in_progress', dueDate: new Date('2026-04-05'), projectId: project3.id },
      { title: 'Work starts on site', status: 'pending', dueDate: new Date('2026-04-15'), projectId: project3.id },
    ],
  })

  // Activity logs
  await prisma.activityLog.createMany({
    data: [
      { action: 'created', entityType: 'project', entityId: project1.id, details: 'Created project "3BHK Interior — Green Valley"', userId: user.id, projectId: project1.id },
      { action: 'created', entityType: 'project', entityId: project2.id, details: 'Created project "Palm Springs Villa — Full Interior"', userId: user.id, projectId: project2.id },
      { action: 'created', entityType: 'project', entityId: project3.id, details: 'Created project "2BHK Renovation — Skyline Tower"', userId: user.id, projectId: project3.id },
      { action: 'payment_received', entityType: 'income', entityId: project1.id, details: 'Income of ₹5,00,000 recorded', userId: user.id, projectId: project1.id },
      { action: 'expense_added', entityType: 'expense', entityId: project1.id, details: 'Expense of ₹45,000 added (materials)', userId: user.id, projectId: project1.id },
    ],
  })

  console.log('✅ Project 1: 3BHK Interior — Green Valley (Active)')
  console.log('✅ Project 2: Palm Springs Villa — Full Interior (Completed)')
  console.log('✅ Project 3: 2BHK Renovation — Skyline Tower (Planning)')
  console.log('')
  console.log('🎉 Seed complete! Login with:')
  console.log('   Email: ratandeep@exploreinteriors.app')
  console.log('   Password: demo123')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

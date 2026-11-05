import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clientExpenseTotal,
  clientLaborPaidTotal,
  clientMaterialPaymentTotal,
  computeProjectFinance,
  isCountedExpense,
  laborDueTotal,
  materialDueTotal,
  materialPaymentTotal,
} from './finance'

const project = {
  budget: 100000,
  incomeTransactions: [{ amount: 50000 }],
  expenseTransactions: [
    // Owner-borne billable expense (tax included)
    { amount: 10000, taxAmount: 1000, category: 'transport' },
    // Linked to labor — must not double count
    { amount: 5000, taxAmount: 0, category: 'labor', laborEntryId: 'lab-1' },
    // Client-borne billable expense
    { amount: 7000, taxAmount: 0, paidByClient: true, category: 'site_expense' },
    // Pending and rejected — never counted
    { amount: 3000, approvalStatus: 'pending' },
    { amount: 2000, approvalStatus: 'rejected' },
  ],
  materialEntries: [
    {
      billAmount: 20000,
      paidByClient: false,
      category: 'materials',
      payments: [{ amount: 8000 }, { amount: 4000 }],
    },
    {
      billAmount: 30000,
      paidByClient: true,
      category: 'furnishing',
      payments: [{ amount: 15000 }],
    },
  ],
  laborEntries: [
    { totalAmount: 25000, advancePaid: 5000, paidByClient: false },
    { totalAmount: 10000, advancePaid: 4000, paidByClient: true },
  ],
}

test('empty project produces zero totals', () => {
  const finance = computeProjectFinance({})
  assert.equal(finance.income, 0)
  assert.equal(finance.expenses, 0)
  assert.equal(finance.labor, 0)
  assert.equal(finance.totalCost, 0)
  assert.equal(finance.netProfit, 0)
  assert.equal(finance.budgetUtilization, 0)
  assert.equal(finance.clientPaidToDate, 0)
})

test('pending and rejected expenses are excluded, legacy status counts as approved', () => {
  assert.equal(isCountedExpense({ amount: 1, approvalStatus: 'pending' }), false)
  assert.equal(isCountedExpense({ amount: 1, approvalStatus: 'rejected' }), false)
  assert.equal(isCountedExpense({ amount: 1, approvalStatus: 'approved' }), true)
  assert.equal(isCountedExpense({ amount: 1 }), true)
})

test('expenses include tax, exclude labor-linked rows, and add material payments', () => {
  const finance = computeProjectFinance(project)
  // (10000 + 1000 owner) + (7000 client) + (8000 + 4000 + 15000 materials)
  assert.equal(finance.expenses, 45000)
  // Labor contract value is tracked separately
  assert.equal(finance.labor, 35000)
  assert.equal(finance.totalCost, 80000)
})

test('owner P&L excludes everything the client pays for', () => {
  const finance = computeProjectFinance(project)
  // Owner expenses: 11000 billable + 12000 owner material payments
  assert.equal(finance.ownerExpenses, 23000)
  assert.equal(finance.ownerLabor, 25000)
  assert.equal(finance.netProfit, 2000)
  assert.equal(finance.profitMargin, 4)
})

test('client-borne cost and client cash paid are different figures', () => {
  const finance = computeProjectFinance(project)
  // Client bears: 7000 expense + 15000 material + full 10000 labor value
  assert.equal(finance.clientBorneCost, 32000)
  // Client has actually paid: 50000 income + 7000 + 15000 + 4000 labor advance
  assert.equal(finance.clientPaidToDate, 76000)
  assert.equal(finance.clientBudgetRemaining, 24000)
})

test('pending approvals are reported but not included in totals', () => {
  const finance = computeProjectFinance(project)
  assert.equal(finance.pendingApproval, 3000)
})

test('budget utilization counts client-paid spend', () => {
  const finance = computeProjectFinance(project)
  assert.equal(finance.budgetUtilization, 80)
  assert.equal(finance.budgetRemaining, 20000)
  assert.equal(finance.pendingReceivable, 50000)
})

test('payables separate owner dues from client-paid balances', () => {
  const finance = computeProjectFinance(project)
  assert.equal(finance.materialBills, 50000)
  assert.equal(finance.materialPaid, 27000)
  assert.equal(finance.materialDue, 23000)
  assert.equal(finance.ownerMaterialDue, 8000)
  assert.equal(finance.laborPaid, 9000)
  assert.equal(finance.laborDue, 26000)
  assert.equal(finance.ownerLaborDue, 20000)
  assert.equal(finance.pendingPayables, 28000)
})

test('material and labor helpers can filter by payer', () => {
  assert.equal(materialPaymentTotal(project.materialEntries), 27000)
  assert.equal(materialPaymentTotal(project.materialEntries, (entry) => !entry.paidByClient), 12000)
  assert.equal(materialPaymentTotal(project.materialEntries, (entry) => !!entry.paidByClient), 15000)
  assert.equal(clientMaterialPaymentTotal(project), 15000)
  assert.equal(clientExpenseTotal(project), 7000)
  assert.equal(clientLaborPaidTotal(project), 4000)
})

test('overpaid material or labor entries do not produce negative dues', () => {
  assert.equal(materialDueTotal([{ billAmount: 5000, payments: [{ amount: 8000 }] }]), 0)
  assert.equal(laborDueTotal([{ totalAmount: 5000, advancePaid: 8000 }]), 0)
})

test('payable helpers can be filtered to owner-borne entries', () => {
  assert.equal(
    materialDueTotal(project.materialEntries, (entry) => !entry.paidByClient),
    8000
  )
  assert.equal(
    laborDueTotal(project.laborEntries, (entry) => !entry.paidByClient),
    20000
  )
})

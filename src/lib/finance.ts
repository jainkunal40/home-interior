/**
 * Shared financial rules for SiteBooks / Explore Interiors.
 *
 * Every screen that reports money — dashboard, project header, overview,
 * reports, client portal, statement PDF, Telegram bot — should use these
 * helpers so the numbers always agree.
 *
 * Core rules
 * ----------
 * 1. Only counted expenses are included. `pending` and `rejected` expenses
 *    are excluded until approved. Missing/legacy status counts as approved.
 * 2. Expenses linked to a labor entry are excluded from expense totals;
 *    the labor entry already carries that cost (avoids double counting).
 * 3. Material spend lives in MaterialEntry + MaterialPayment. Payments are
 *    counted as spend; unpaid bill balances are payables, not spend.
 * 4. Owner P&L uses only owner-borne costs. Anything flagged `paidByClient`
 *    is excluded from net profit but still counts toward budget utilization.
 * 5. A client's "total paid" is cash actually paid by the client: income
 *    recorded, client-paid expenses, client-paid material payments, and
 *    labor advances on client-paid labor entries.
 */

export type MaybeArray<T> = T[] | null | undefined

export interface IncomeRecord {
  amount: number
}

export interface ExpenseRecord {
  amount: number
  taxAmount?: number | null
  paidByClient?: boolean | null
  laborEntryId?: string | null
  approvalStatus?: string | null
  category?: string | null
  date?: Date | string | null
}

export interface MaterialPaymentRecord {
  amount: number
  date?: Date | string | null
}

export interface MaterialEntryRecord {
  billAmount?: number | null
  paidByClient?: boolean | null
  category?: string | null
  payments?: MaybeArray<MaterialPaymentRecord>
}

export interface LaborEntryRecord {
  totalAmount?: number | null
  advancePaid?: number | null
  paidByClient?: boolean | null
  tradeType?: string | null
}

export interface ProjectFinanceInput {
  budget?: number | null
  incomeTransactions?: MaybeArray<IncomeRecord>
  expenseTransactions?: MaybeArray<ExpenseRecord>
  materialEntries?: MaybeArray<MaterialEntryRecord>
  laborEntries?: MaybeArray<LaborEntryRecord>
}

export interface ProjectFinance {
  /** Project budget as entered (0 when unset). */
  budget: number
  /** Income recorded for the project. */
  income: number
  /** Counted, non-labor expenses plus material payments (owner + client). */
  expenses: number
  /** Labor contract value (owner + client). */
  labor: number
  /** expenses + labor — the number compared against budget. */
  totalCost: number
  /** Owner-borne non-labor expenses plus owner-paid material payments. */
  ownerExpenses: number
  /** Labor contract value not flagged as paid by the client. */
  ownerLabor: number
  /** income − ownerExpenses − ownerLabor. */
  netProfit: number
  /** Net profit as a percentage of income (0 when income is 0). */
  profitMargin: number
  /** Full cost borne by the client (client expenses + materials + labor value). */
  clientBorneCost: number
  /** Cash the client has actually paid: income + client expenses + materials + labor advances. */
  clientPaidToDate: number
  /** Budget left after client payments (portal "Remaining"). */
  clientBudgetRemaining: number
  /** Pending client-submitted expenses, not included in any total above. */
  pendingApproval: number
  /** Budget not yet received as income. */
  pendingReceivable: number
  materialBills: number
  materialPaid: number
  /** Unpaid material bills across all entries (owner + client). */
  materialDue: number
  laborPaid: number
  /** Labor due across all entries (owner + client). */
  laborDue: number
  /** Unpaid material bills the owner is responsible for. */
  ownerMaterialDue: number
  /** Labor dues the owner is responsible for. */
  ownerLaborDue: number
  /** ownerMaterialDue + ownerLaborDue. */
  pendingPayables: number
  /** budget − totalCost (negative means over budget). */
  budgetRemaining: number
  /** totalCost / budget as a percentage (0 when budget is 0). */
  budgetUtilization: number
}

function sum<T>(items: MaybeArray<T>, pick: (item: T) => number): number {
  if (!items) return 0
  return items.reduce((total, item) => total + pick(item), 0)
}

/** Expense amount including tax. */
export function expenseAmount(expense: ExpenseRecord): number {
  return expense.amount + (expense.taxAmount ?? 0)
}

/** Pending and rejected expenses never affect totals. */
export function isCountedExpense(expense: ExpenseRecord): boolean {
  return expense.approvalStatus !== 'pending' && expense.approvalStatus !== 'rejected'
}

export function isPendingExpense(expense: ExpenseRecord): boolean {
  return expense.approvalStatus === 'pending'
}

/** Labor-linked expenses are represented by the labor entry instead. */
export function isLaborLinkedExpense(expense: ExpenseRecord): boolean {
  return !!expense.laborEntryId
}

export function countedExpenses(project: ProjectFinanceInput): ExpenseRecord[] {
  return (project.expenseTransactions ?? []).filter(isCountedExpense)
}

export function pendingExpenses(project: ProjectFinanceInput): ExpenseRecord[] {
  return (project.expenseTransactions ?? []).filter(isPendingExpense)
}

/** Counted expenses that are not already represented by a labor entry. */
export function billableExpenses(project: ProjectFinanceInput): ExpenseRecord[] {
  return countedExpenses(project).filter((expense) => !isLaborLinkedExpense(expense))
}

export function sumExpenses(expenses: MaybeArray<ExpenseRecord>): number {
  return sum(expenses, expenseAmount)
}

export function incomeTotal(project: ProjectFinanceInput): number {
  return sum(project.incomeTransactions, (income) => income.amount)
}

export function materialBillTotal(entries: MaybeArray<MaterialEntryRecord>): number {
  return sum(entries, (entry) => entry.billAmount ?? 0)
}

export function materialPaymentTotal(
  entries: MaybeArray<MaterialEntryRecord>,
  filter?: (entry: MaterialEntryRecord) => boolean
): number {
  return sum(entries, (entry) => {
    if (filter && !filter(entry)) return 0
    return sum(entry.payments, (payment) => payment.amount)
  })
}

export function materialDueTotal(
  entries: MaybeArray<MaterialEntryRecord>,
  filter?: (entry: MaterialEntryRecord) => boolean
): number {
  return sum(entries, (entry) => {
    if (filter && !filter(entry)) return 0
    const paid = sum(entry.payments, (payment) => payment.amount)
    return Math.max(0, (entry.billAmount ?? 0) - paid)
  })
}

export function laborTotal(entries: MaybeArray<LaborEntryRecord>): number {
  return sum(entries, (entry) => entry.totalAmount ?? 0)
}

export function laborPaidTotal(
  entries: MaybeArray<LaborEntryRecord>,
  filter?: (entry: LaborEntryRecord) => boolean
): number {
  return sum(entries, (entry) => (filter && !filter(entry) ? 0 : entry.advancePaid ?? 0))
}

export function laborDueTotal(
  entries: MaybeArray<LaborEntryRecord>,
  filter?: (entry: LaborEntryRecord) => boolean
): number {
  return sum(entries, (entry) => {
    if (filter && !filter(entry)) return 0
    return Math.max(0, (entry.totalAmount ?? 0) - (entry.advancePaid ?? 0))
  })
}

/** Counted client-paid expenses, excluding labor-linked rows. */
export function clientExpenseTotal(project: ProjectFinanceInput): number {
  return sumExpenses(
    billableExpenses(project).filter((expense) => !!expense.paidByClient)
  )
}

export function clientMaterialPaymentTotal(project: ProjectFinanceInput): number {
  return materialPaymentTotal(project.materialEntries, (entry) => !!entry.paidByClient)
}

export function clientLaborPaidTotal(project: ProjectFinanceInput): number {
  return laborPaidTotal(project.laborEntries, (entry) => !!entry.paidByClient)
}

/**
 * Single source of truth for project totals.
 * Accepts plain Prisma objects; only the fields above are read.
 */
export function computeProjectFinance(project: ProjectFinanceInput): ProjectFinance {
  const budget = project.budget ?? 0
  const income = incomeTotal(project)
  const billable = billableExpenses(project)

  const expenseBills = sumExpenses(billable)
  const materialsPaid = materialPaymentTotal(project.materialEntries)
  const expenses = expenseBills + materialsPaid

  const labor = laborTotal(project.laborEntries)
  const totalCost = expenses + labor

  const ownerMaterialPaid = materialPaymentTotal(project.materialEntries, (entry) => !entry.paidByClient)
  const ownerExpenses =
    sumExpenses(billable.filter((expense) => !expense.paidByClient)) + ownerMaterialPaid
  const ownerLabor = laborTotal(
    (project.laborEntries ?? []).filter((entry) => !entry.paidByClient)
  )

  const netProfit = income - ownerExpenses - ownerLabor
  const clientBorneCost = expenses - ownerExpenses + (labor - ownerLabor)

  const clientPaidToDate =
    income +
    clientExpenseTotal(project) +
    clientMaterialPaymentTotal(project) +
    clientLaborPaidTotal(project)

  const pendingApproval = sumExpenses(pendingExpenses(project))

  const materialBills = materialBillTotal(project.materialEntries)
  const materialDue = materialDueTotal(project.materialEntries)
  const laborPaid = laborPaidTotal(project.laborEntries)
  const laborDue = laborDueTotal(project.laborEntries)
  const ownerMaterialDue = materialDueTotal(project.materialEntries, (entry) => !entry.paidByClient)
  const ownerLaborDue = laborDueTotal(project.laborEntries, (entry) => !entry.paidByClient)

  const budgetRemaining = budget - totalCost
  const clientBudgetRemaining = budget - clientPaidToDate

  return {
    budget,
    income,
    expenses,
    labor,
    totalCost,
    ownerExpenses,
    ownerLabor,
    netProfit,
    profitMargin: income > 0 ? (netProfit / income) * 100 : 0,
    clientBorneCost,
    clientPaidToDate,
    clientBudgetRemaining,
    pendingApproval,
    pendingReceivable: budget > 0 ? Math.max(0, budget - income) : 0,
    materialBills,
    materialPaid: materialsPaid,
    materialDue,
    laborPaid,
    laborDue,
    ownerMaterialDue,
    ownerLaborDue,
    pendingPayables: ownerMaterialDue + ownerLaborDue,
    budgetRemaining,
    budgetUtilization: budget > 0 ? (totalCost / budget) * 100 : 0,
  }
}

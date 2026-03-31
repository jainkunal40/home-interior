/**
 * Indian Rupee currency formatting utilities
 */

/** Format a number as INR with proper Indian grouping: ₹12,50,000.00 */
export function formatINR(amount: number | null | undefined, showDecimals = true): string {
  if (amount == null) return '₹0'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  // Indian number formatting
  const [intPart, decPart] = abs.toFixed(2).split('.')
  const lastThree = intPart.slice(-3)
  const rest = intPart.slice(0, -3)
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (rest ? ',' : '') + lastThree

  if (showDecimals && decPart && decPart !== '00') {
    return `${sign}₹${formatted}.${decPart}`
  }
  return `${sign}₹${formatted}`
}

/** Format a compact INR: ₹12.5L, ₹1.2Cr */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`
  return formatINR(amount, false)
}

/** Parse an INR string back to number */
export function parseINR(value: string): number {
  return parseFloat(value.replace(/[₹,\s]/g, '')) || 0
}

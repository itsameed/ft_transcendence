import type { Expense, FriendBalance } from '../types'

export interface BalanceSummary {
  owedToYou: number
  youOwe: number
  net: number
  peopleOwingYou: number
  peopleYouOwe: number
}

export function summarize(balances: FriendBalance[]): BalanceSummary {
  let owedToYou = 0
  let youOwe = 0
  let peopleOwingYou = 0
  let peopleYouOwe = 0
  for (const { amount } of balances) {
    if (amount > 0) {
      owedToYou += amount
      peopleOwingYou++
    } else if (amount < 0) {
      youOwe += -amount
      peopleYouOwe++
    }
  }
  return { owedToYou, youOwe, net: owedToYou - youOwe, peopleOwingYou, peopleYouOwe }
}

/**
 * How an expense moves *your* balance.
 * You paid -> you lent everyone else's share.
 * Someone else paid -> you borrowed your own share.
 */
export function yourEffect(expense: Expense, me: string): { kind: 'lent' | 'borrowed' | 'none'; amount: number } {
  const yourShare = expense.shares.find((s) => s.userId === me)?.amount ?? 0
  if (expense.paidBy === me) {
    const lent = expense.amount - yourShare
    return lent > 0 ? { kind: 'lent', amount: lent } : { kind: 'none', amount: 0 }
  }
  return yourShare > 0 ? { kind: 'borrowed', amount: yourShare } : { kind: 'none', amount: 0 }
}

/** Split `total` into `n` parts that add up exactly (extra cents go to the first people). */
export function splitEvenly(total: number, n: number): number[] {
  if (n <= 0) return []
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / n)
  const remainder = cents - base * n
  return Array.from({ length: n }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100)
}

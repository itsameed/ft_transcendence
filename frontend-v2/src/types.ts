// Shapes the dashboard expects. When you wire the backend, make your API
// responses match these (or map them into these) and the UI won't care.

export type UserId = string

export interface User {
  id: UserId
  name: string
  email: string
}

export type GroupKind = 'trip' | 'home' | 'event' | 'other'

export interface Group {
  id: string
  name: string
  emoji: string
  kind: GroupKind
  memberIds: UserId[]
  /** Sum of every expense in the group. */
  totalSpent: number
  /** Positive: the group owes you. Negative: you owe the group. */
  yourBalance: number
  startDate?: string
  endDate?: string
  lastActivityAt: string
}

export type Category =
  | 'food'
  | 'lodging'
  | 'transport'
  | 'groceries'
  | 'activities'
  | 'utilities'
  | 'other'

export interface ExpenseShare {
  userId: UserId
  amount: number
}

export interface Expense {
  type: 'expense'
  id: string
  groupId: string
  title: string
  category: Category
  amount: number
  paidBy: UserId
  shares: ExpenseShare[]
  createdAt: string
}

export interface Settlement {
  type: 'settlement'
  id: string
  groupId: string
  from: UserId
  to: UserId
  amount: number
  createdAt: string
}

export type Activity = Expense | Settlement

/** Net balance between you and one friend, across every group. */
export interface FriendBalance {
  userId: UserId
  /** Positive: they owe you. Negative: you owe them. */
  amount: number
}

export interface CategorySpend {
  category: Category
  /** Your share only, not what you paid up front. */
  amount: number
}

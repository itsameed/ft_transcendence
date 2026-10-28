export interface User {
  id: string
  name: string
  color: string
}

export interface Group {
  id: string
  name: string
  emoji: string
  tint: string
  members: User[]
  totalSpent: number
  // positive = the group owes you, negative = you owe the group
  yourBalance: number
  updated: string
}

export type ActivityKind = 'expense' | 'settlement' | 'member'

export interface Activity {
  id: string
  kind: ActivityKind
  actor: User
  title: string
  group: string
  time: string
  // effect on your balance: positive = you get money back, negative = you owe
  yourShare?: number
}

export interface FriendBalance {
  friend: User
  // positive = they owe you, negative = you owe them
  amount: number
}

export interface MonthSpend {
  month: string
  amount: number
}

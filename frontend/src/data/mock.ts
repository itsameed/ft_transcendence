import type { Activity, FriendBalance, Group, MonthSpend, User } from '../types'

// Fake data shaped like what the backend will return later.
// When we wire the API, only this file gets replaced by fetch calls.

export const me: User = { id: 'u0', name: 'Zakaria Didah', color: '#0A84FF' }

const sara: User = { id: 'u1', name: 'Sara Amrani', color: '#FF375F' }
const youssef: User = { id: 'u2', name: 'Youssef Benali', color: '#30B0C7' }
const ines: User = { id: 'u3', name: 'Ines Kabbaj', color: '#BF5AF2' }
const omar: User = { id: 'u4', name: 'Omar Tazi', color: '#FF9F0A' }
const lina: User = { id: 'u5', name: 'Lina Chraibi', color: '#32D74B' }

export const groups: Group[] = [
  {
    id: 'g1',
    name: 'Weekend Trip',
    emoji: '🏔️',
    tint: '#0A84FF',
    members: [me, sara, youssef, ines],
    totalSpent: 1240.5,
    yourBalance: 186.2,
    updated: '2h ago',
  },
  {
    id: 'g2',
    name: 'Apartment 4B',
    emoji: '🏠',
    tint: '#FF9F0A',
    members: [me, omar, lina],
    totalSpent: 3420,
    yourBalance: -72.4,
    updated: 'Yesterday',
  },
  {
    id: 'g3',
    name: 'Friday Dinners',
    emoji: '🍜',
    tint: '#FF375F',
    members: [me, sara, omar, lina, youssef],
    totalSpent: 568.75,
    yourBalance: 0,
    updated: '3d ago',
  },
  {
    id: 'g4',
    name: 'Office Coffee',
    emoji: '☕️',
    tint: '#AC8E68',
    members: [me, ines, youssef],
    totalSpent: 94.3,
    yourBalance: 12.1,
    updated: '1w ago',
  },
]

export const activity: Activity[] = [
  { id: 'a1', kind: 'expense', actor: sara, title: 'Cabin rental', group: 'Weekend Trip', time: '2h ago', yourShare: -112.5 },
  { id: 'a2', kind: 'expense', actor: me, title: 'Groceries', group: 'Apartment 4B', time: '5h ago', yourShare: 64.0 },
  { id: 'a3', kind: 'settlement', actor: omar, title: 'paid you back', group: 'Apartment 4B', time: 'Yesterday', yourShare: 40.0 },
  { id: 'a4', kind: 'member', actor: lina, title: 'joined the group', group: 'Friday Dinners', time: '2d ago' },
  { id: 'a5', kind: 'expense', actor: youssef, title: 'Gas & tolls', group: 'Weekend Trip', time: '3d ago', yourShare: -28.75 },
  { id: 'a6', kind: 'expense', actor: me, title: 'Ramen night', group: 'Friday Dinners', time: '3d ago', yourShare: 91.0 },
]

export const friendBalances: FriendBalance[] = [
  { friend: sara, amount: 124.0 },
  { friend: youssef, amount: 62.2 },
  { friend: omar, amount: -72.4 },
  { friend: ines, amount: 12.1 },
]

export const monthlySpend: MonthSpend[] = [
  { month: 'May', amount: 420 },
  { month: 'Jun', amount: 610 },
  { month: 'Jul', amount: 380 },
  { month: 'Aug', amount: 890 },
  { month: 'Sep', amount: 540 },
  { month: 'Oct', amount: 735 },
]

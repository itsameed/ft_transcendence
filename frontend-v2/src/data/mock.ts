import type { Activity, FriendBalance, Group, User } from '../types'

// Everything here is fake. Replace each export with a fetch to your API.

export const ME = 'u_me'

export const users: Record<string, User> = {
  u_me: { id: 'u_me', name: 'Zakaria Didah', email: 'zakaria@tally.app' },
  u_yassine: { id: 'u_yassine', name: 'Yassine Amrani', email: 'yassine@tally.app' },
  u_salma: { id: 'u_salma', name: 'Salma Bennani', email: 'salma@tally.app' },
  u_omar: { id: 'u_omar', name: 'Omar Tazi', email: 'omar@tally.app' },
  u_hiba: { id: 'u_hiba', name: 'Hiba El Idrissi', email: 'hiba@tally.app' },
  u_anas: { id: 'u_anas', name: 'Anas Berrada', email: 'anas@tally.app' },
  u_mehdi: { id: 'u_mehdi', name: 'Mehdi Alaoui', email: 'mehdi@tally.app' },
  u_imane: { id: 'u_imane', name: 'Imane Chraibi', email: 'imane@tally.app' },
}

export const groups: Group[] = [
  {
    id: 'g_chaouen',
    name: 'Chefchaouen Trip',
    emoji: '🏔️',
    kind: 'trip',
    memberIds: ['u_me', 'u_yassine', 'u_salma', 'u_omar', 'u_hiba'],
    totalSpent: 6840,
    yourBalance: 1378,
    startDate: '2026-10-10',
    endDate: '2026-10-14',
    lastActivityAt: '2026-10-16T09:12:00',
  },
  {
    id: 'g_apt',
    name: 'Apartment 4B',
    emoji: '🏠',
    kind: 'home',
    memberIds: ['u_me', 'u_anas', 'u_mehdi'],
    totalSpent: 4206,
    yourBalance: -560,
    lastActivityAt: '2026-10-16T08:40:00',
  },
  {
    id: 'g_surf',
    name: 'Taghazout Surf Weekend',
    emoji: '🏄',
    kind: 'trip',
    memberIds: ['u_me', 'u_salma', 'u_hiba', 'u_imane'],
    totalSpent: 1200,
    yourBalance: -300,
    startDate: '2026-11-06',
    endDate: '2026-11-08',
    lastActivityAt: '2026-10-10T19:05:00',
  },
  {
    id: 'g_foot',
    name: 'Friday Football',
    emoji: '⚽',
    kind: 'event',
    memberIds: ['u_me', 'u_omar', 'u_anas', 'u_mehdi', 'u_yassine', 'u_imane'],
    totalSpent: 900,
    yourBalance: -45,
    lastActivityAt: '2026-10-15T21:30:00',
  },
]

export const friendBalances: FriendBalance[] = [
  { userId: 'u_salma', amount: 650 },
  { userId: 'u_hiba', amount: 412 },
  { userId: 'u_omar', amount: 306 },
  { userId: 'u_imane', amount: 120 },
  { userId: 'u_mehdi', amount: -215 },
  { userId: 'u_anas', amount: -380 },
  { userId: 'u_yassine', amount: -420 },
]

export const recentActivity: Activity[] = [
  {
    type: 'settlement',
    id: 's_1',
    groupId: 'g_chaouen',
    from: 'u_omar',
    to: 'u_me',
    amount: 150,
    createdAt: '2026-10-16T09:12:00',
  },
  {
    type: 'expense',
    id: 'e_1',
    groupId: 'g_apt',
    title: 'Weekly groceries — Marjane',
    category: 'groceries',
    amount: 642,
    paidBy: 'u_anas',
    shares: [
      { userId: 'u_me', amount: 214 },
      { userId: 'u_anas', amount: 214 },
      { userId: 'u_mehdi', amount: 214 },
    ],
    createdAt: '2026-10-16T08:40:00',
  },
  {
    type: 'expense',
    id: 'e_2',
    groupId: 'g_foot',
    title: 'Pitch rental',
    category: 'activities',
    amount: 300,
    paidBy: 'u_omar',
    shares: ['u_me', 'u_omar', 'u_anas', 'u_mehdi', 'u_yassine', 'u_imane'].map((userId) => ({
      userId,
      amount: 50,
    })),
    createdAt: '2026-10-15T21:30:00',
  },
  {
    type: 'expense',
    id: 'e_3',
    groupId: 'g_chaouen',
    title: 'Dinner at Bab Ssour',
    category: 'food',
    amount: 850,
    paidBy: 'u_me',
    shares: ['u_me', 'u_yassine', 'u_salma', 'u_omar', 'u_hiba'].map((userId) => ({
      userId,
      amount: 170,
    })),
    createdAt: '2026-10-14T21:05:00',
  },
  {
    type: 'expense',
    id: 'e_4',
    groupId: 'g_chaouen',
    title: 'Grand taxi back to Tangier',
    category: 'transport',
    amount: 600,
    paidBy: 'u_yassine',
    shares: ['u_me', 'u_yassine', 'u_salma', 'u_omar', 'u_hiba'].map((userId) => ({
      userId,
      amount: 120,
    })),
    createdAt: '2026-10-14T16:20:00',
  },
  {
    type: 'expense',
    id: 'e_5',
    groupId: 'g_chaouen',
    title: 'Riad Dar Elfenn · 3 nights',
    category: 'lodging',
    amount: 3600,
    paidBy: 'u_me',
    shares: ['u_me', 'u_yassine', 'u_salma', 'u_omar', 'u_hiba'].map((userId) => ({
      userId,
      amount: 720,
    })),
    createdAt: '2026-10-12T11:00:00',
  },
  {
    type: 'settlement',
    id: 's_2',
    groupId: 'g_chaouen',
    from: 'u_me',
    to: 'u_yassine',
    amount: 200,
    createdAt: '2026-10-11T18:45:00',
  },
  {
    type: 'expense',
    id: 'e_6',
    groupId: 'g_surf',
    title: 'Surf camp deposit',
    category: 'activities',
    amount: 1200,
    paidBy: 'u_salma',
    shares: ['u_me', 'u_salma', 'u_hiba', 'u_imane'].map((userId) => ({ userId, amount: 300 })),
    createdAt: '2026-10-10T19:05:00',
  },
]


/** Pretend "today", so relative dates in the mock always read sensibly. */
export const NOW = new Date('2026-10-16T12:00:00')

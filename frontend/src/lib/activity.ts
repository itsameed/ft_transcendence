import type { Activity, Category, Expense, GroupKind, User } from '../types'

/* ------------------------------------------------------------------
   Category inference
   The add-expense flow doesn't ask for a category, so every expense
   arrives as "other". Rather than show a wall of identical receipt
   icons, guess from the title. A real category always wins.
------------------------------------------------------------------- */
const RULES: [Category, RegExp][] = [
  ['lodging', /\b(riad|hotel|hostel|airbnb|rent|apartment|flat|room|deposit|camping|lodg|stay)/i],
  ['transport', /\b(taxi|uber|careem|indrive|bus|train|oncf|flight|plane|fuel|gas(?!\s*bill)|petrol|diesel|parking|car\b|toll|tram|ferry|ride)/i],
  ['groceries', /\b(grocer|market|marjane|carrefour|supermarket|bim\b|souk|supplies|shopping|hanout)/i],
  ['utilities', /\b(electric|water|wifi|wi-fi|internet|bill|utilit|phone|netflix|spotify|subscription|lydec|redal)/i],
  ['activities', /\b(ticket|football|pitch|match|museum|tour|guide|surf|cinema|game|concert|hammam|gym|padel|activity|gift)/i],
  ['food', /\b(dinner|lunch|breakfast|brunch|food|restaurant|cafe|café|coffee|tea|pizza|tajine|tagine|couscous|snack|drinks?|meal|bbq|grill|sushi|burger)/i],
]

export function inferCategory(title: string, given?: string | null): Category {
  if (given && given !== 'other') return given as Category
  for (const [category, pattern] of RULES) if (pattern.test(title)) return category
  return 'other'
}

/** Which tint a group kind wears, so a dinner group matches a dinner expense. */
const KIND_TINT: Partial<Record<GroupKind, Category>> = {
  dinner: 'food', party: 'food',
  trip: 'transport', roadtrip: 'transport', citytrip: 'transport', cruise: 'transport',
  home: 'lodging', retreat: 'lodging', wedding: 'lodging',
  sports: 'activities', festival: 'activities', concert: 'activities', event: 'activities', skiing: 'activities',
  camping: 'groceries', hiking: 'groceries',
  vacation: 'utilities', beach: 'utilities', conference: 'utilities', workshop: 'utilities',
}

export function kindTint(kind: string): Category {
  return KIND_TINT[kind as GroupKind] ?? 'other'
}

/* ------------------------------------------------------------------
   Loading
   Merge every group's expenses with the caller's accepted settlements
   into one newest-first feed, and collect the people it mentions.
------------------------------------------------------------------- */
export interface ActivityFeed {
  items: Activity[]
  users: Record<string, User>
}

const idOf = (v: unknown): string => {
  if (v && typeof v === 'object') {
    const o = v as { _id?: unknown; id?: unknown }
    return String(o._id ?? o.id ?? '')
  }
  return v == null ? '' : String(v)
}

export async function loadActivity(groupIds: string[]): Promise<ActivityFeed> {
  const users: Record<string, User> = {}
  const remember = (u: any) => {
    const id = idOf(u)
    if (id && u?.username && !users[id]) users[id] = { id, name: u.username, email: u.email ?? '', avatar: u.avatar ?? null }
  }

  const [expenseLists, settlementsRes] = await Promise.all([
    Promise.all(groupIds.map(async (groupId) => {
      const res = await fetch(`/api/groups/${groupId}/expenses`).catch(() => null)
      if (!res?.ok) return []
      const data = await res.json().catch(() => null)
      return ((data?.expenses ?? []) as any[]).map((e): Expense => {
        remember(e.payer)
        const title = String(e.title || e.description || 'Expense')
        return {
          type: 'expense',
          id: idOf(e.id ?? e._id),
          groupId,
          title,
          category: inferCategory(title, e.category),
          amount: Number(e.amount ?? 0),
          paidBy: idOf(e.paidBy ?? e.payer),
          shares: (e.shares ?? []).map((s: any) => ({ userId: String(s.userId), amount: Number(s.amount ?? 0) })),
          createdAt: e.date ?? e.createdAt,
        }
      })
    })),
    fetch('/api/settlements').catch(() => null),
  ])

  const items: Activity[] = expenseLists.flat()

  if (settlementsRes?.ok) {
    const data = await settlementsRes.json().catch(() => null)
    const wanted = new Set(groupIds)
    for (const s of (data?.settlements ?? []) as any[]) {
      if (s.status && s.status !== 'accepted') continue
      if (!wanted.has(idOf(s.group))) continue
      remember(s.fromUser)
      remember(s.toUser)
      items.push({
        type: 'settlement',
        id: idOf(s._id),
        groupId: idOf(s.group),
        from: idOf(s.fromUser),
        to: idOf(s.toUser),
        amount: Number(s.amount ?? 0),
        createdAt: s.date ?? s.createdAt,
      })
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return { items, users }
}

/** Your own share of an expense (what you consumed, whoever paid). */
export function myShare(expense: Expense, me: string): number {
  return expense.shares.find((s) => s.userId === me)?.amount ?? 0
}

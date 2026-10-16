import type { Category } from '../types'

export const CURRENCY = 'MAD'

const moneyFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** 1378 -> "1,378 MAD". Always unsigned; pass `signed` to get "+1,378 MAD". */
export function money(value: number, opts: { signed?: boolean } = {}): string {
  const abs = moneyFmt.format(Math.abs(value))
  const sign = opts.signed ? (value > 0 ? '+' : value < 0 ? '−' : '') : ''
  return `${sign}${abs} ${CURRENCY}`
}

export function compactMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function firstName(fullName: string): string {
  return fullName.split(' ')[0]
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

const DAY = 24 * 60 * 60 * 1000

export function relativeDay(iso: string, now: Date): string {
  const date = new Date(iso)
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((startOf(now) - startOf(date)) / DAY)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff > 1 && diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function dateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' })
  return s.getMonth() === e.getMonth()
    ? `${month(s)} ${s.getDate()}–${e.getDate()}`
    : `${month(s)} ${s.getDate()} – ${month(e)} ${e.getDate()}`
}

export function daysUntil(iso: string, now: Date): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY)
}

export const categoryLabel: Record<Category, string> = {
  food: 'Food & drinks',
  lodging: 'Lodging',
  transport: 'Transport',
  groceries: 'Groceries',
  activities: 'Activities',
  utilities: 'Bills & utilities',
  other: 'Other',
}

export function greeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { Activity, Expense, Group } from '../../types'
import { myShare } from '../../lib/activity'
import { money } from '../../lib/format'
import { iconForKind } from '../../lib/GroupKinds'
import { kindTint } from '../../lib/activity'
import { Card } from '../ui/Card'
import styles from './SpendingCard.module.css'

const WEEKS = 8
const DAY = 86_400_000

function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)) // Monday
  return s
}

const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

interface Props {
  items: Activity[]
  groups: Group[]
  me: string
  now: Date
  loading?: boolean
}

/**
 * Your share of shared costs (what you used, not what you fronted).
 * Headline number for the month, eight weeks of context, and where it went.
 */
export function SpendingCard({ items, groups, me, now, loading }: Props) {
  const expenses = items.filter((a): a is Expense => a.type === 'expense')
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  const prevName = prevStart.toLocaleDateString('en-US', { month: 'long' })

  let thisMonth = 0
  let lastMonth = 0
  const byGroup = new Map<string, number>()
  const thisWeek = startOfWeek(now)
  const firstWeek = new Date(thisWeek.getTime() - (WEEKS - 1) * 7 * DAY)
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({ start: new Date(firstWeek.getTime() + i * 7 * DAY), total: 0 }))

  for (const e of expenses) {
    const share = myShare(e, me)
    if (share <= 0) continue
    const d = new Date(e.createdAt)
    if (d >= monthStart && d <= now) {
      thisMonth += share
      byGroup.set(e.groupId, (byGroup.get(e.groupId) ?? 0) + share)
    } else if (d >= prevStart && d < monthStart) {
      lastMonth += share
    }
    const w = Math.floor((startOfWeek(d).getTime() - firstWeek.getTime()) / (7 * DAY) + 0.01)
    if (w >= 0 && w < WEEKS) weeks[w].total += share
  }

  const peak = Math.max(...weeks.map((w) => w.total), 1)
  const delta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const top = [...byGroup.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const nothingYet = !loading && expenses.length === 0

  return (
    <Card padded={false} className={styles.card}>
      <div className={styles.head}>
        <p className={styles.label}>Your share in {monthName}</p>
        <p className={`${styles.total} tabular`}>{loading ? '—' : money(thisMonth)}</p>
        <p className={styles.delta}>
          {loading ? 'Loading your expenses…'
            : nothingYet ? 'Add an expense and your share shows up here.'
            : delta === null ? (lastMonth === 0 && thisMonth > 0 ? `Nothing in ${prevName}` : `Nothing in ${prevName} either`)
            : delta === 0 ? `Same as ${prevName}`
            : (
              <>
                <span className={styles.deltaBadge} data-dir={delta > 0 ? 'up' : 'down'}>
                  {delta > 0 ? <ArrowUpRight size={13} aria-hidden /> : <ArrowDownRight size={13} aria-hidden />}
                  {Math.abs(delta)}%
                </span>
                vs {prevName} ({money(lastMonth)})
              </>
            )}
        </p>
      </div>

      <div className={styles.chart} role="list" aria-label={`Your share per week, last ${WEEKS} weeks`}>
        {weeks.map((w, i) => {
          const current = i === WEEKS - 1
          const label = `${current ? 'This week' : `Week of ${shortDate(w.start)}`}: ${money(w.total)}`
          return (
            <span key={i} role="listitem" className={styles.col} tabIndex={0} aria-label={label} data-tip={label}>
              <span
                className={styles.barFill}
                data-current={current || undefined}
                data-zero={w.total === 0 || undefined}
                style={{ height: `${(w.total / peak) * 100}%` }}
              />
            </span>
          )
        })}
      </div>
      <div className={styles.axis} aria-hidden>
        <span>{shortDate(weeks[0].start)}</span>
        <span>This week</span>
      </div>

      {top.length > 0 && (
        <ul className={styles.groups} aria-label={`Where it went in ${monthName}`}>
          {top.map(([groupId, total]) => {
            const g = groupById.get(groupId)
            const Icon = iconForKind(g?.kind ?? 'other')
            return (
              <li key={groupId}>
                <span className="tint" data-tint={kindTint(g?.kind ?? 'other')} aria-hidden>
                  <Icon size={14} strokeWidth={1.8} aria-hidden />
                </span>
                <span className={styles.groupName}>{g?.name ?? 'Group'}</span>
                <span className={`${styles.groupAmount} tabular`}>{money(total)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

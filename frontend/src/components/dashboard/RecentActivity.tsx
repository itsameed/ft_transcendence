import { ArrowLeftRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Activity, Group, User } from '../../types'
import { yourEffect } from '../../lib/balances'
import { categoryIcon } from '../../lib/categories'
import { firstName, money, relativeDay } from '../../lib/format'
import { Card } from '../ui/Card'
import styles from './RecentActivity.module.css'

interface Props {
  items: Activity[]
  users: Record<string, User>
  groups: Group[]
  me: string
  now: Date
  loading?: boolean
}

interface Row {
  id: string
  icon: ReactNode
  tint: string
  title: string
  detail: string
  group?: Group
  day: string
  effectLabel: string
  effectAmount?: number
  tone: 'owed' | 'owe' | 'neutral'
}

export function RecentActivity({ items, users, groups, me, now, loading }: Props) {
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const name = (id: string) => (id === me ? 'You' : firstName(users[id]?.name ?? 'Someone'))

  const rows: Row[] = items.map((a) => {
    const base = { id: `${a.type}-${a.id}`, group: groupById.get(a.groupId), day: relativeDay(a.createdAt, now) }
    if (a.type === 'settlement') {
      const received = a.to === me
      return {
        ...base,
        icon: <ArrowLeftRight size={16} strokeWidth={1.8} aria-hidden />,
        tint: received ? 'settle-in' : 'settle-out',
        title: `${name(a.from)} paid ${received ? 'you' : name(a.to)}`,
        detail: 'Payment recorded',
        effectLabel: received ? 'received' : 'paid back',
        effectAmount: a.amount,
        tone: 'neutral',
      }
    }
    const Icon = categoryIcon[a.category] ?? categoryIcon.other
    const effect = yourEffect(a, me)
    return {
      ...base,
      icon: <Icon size={16} strokeWidth={1.8} aria-hidden />,
      tint: a.category,
      title: a.title,
      detail: `${name(a.paidBy)} paid ${money(a.amount)}`,
      effectLabel: effect.kind === 'lent' ? 'you lent' : effect.kind === 'borrowed' ? 'you borrowed' : 'not involved',
      effectAmount: effect.kind === 'none' ? undefined : effect.amount,
      tone: effect.kind === 'lent' ? 'owed' : effect.kind === 'borrowed' ? 'owe' : 'neutral',
    }
  })

  return (
    <Card padded={false}>
      {loading ? (
        <ul className={styles.list} aria-busy="true" aria-label="Loading activity">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className={styles.row}>
              <span className={`${styles.icon} ${styles.skeleton}`} />
              <span className={styles.main}>
                <span className={styles.skeletonLine} style={{ width: `${55 - i * 7}%` }} />
                <span className={styles.skeletonLine} style={{ width: `${35 + i * 5}%` }} />
              </span>
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No activity yet. Add your first expense to get started.</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.id} className={styles.row}>
              <span className={`${styles.icon} tint`} data-tint={r.tint} aria-hidden>
                {r.icon}
              </span>
              <span className={styles.main}>
                <strong>{r.title}</strong>
                <span className={styles.meta}>
                  {r.detail}
                  {r.group && (
                    <>
                      <span aria-hidden> · </span>
                      <Link to={`/groups/${r.group.id}`} className={styles.groupLink}>{r.group.name}</Link>
                    </>
                  )}
                </span>
              </span>
              <span className={styles.effect}>
                {r.effectAmount !== undefined ? (
                  <strong className="tabular" data-tone={r.tone}>
                    {money(r.effectAmount)}
                  </strong>
                ) : (
                  <strong className={styles.none}>—</strong>
                )}
                <span>
                  {r.effectLabel} · {r.day}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

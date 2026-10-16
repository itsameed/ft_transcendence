import { ArrowLeftRight } from 'lucide-react'
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
}

interface Row {
  id: string
  icon: React.ReactNode
  title: string
  detail: string
  group: Group
  day: string
  effectLabel: string
  effectAmount?: number
  tone: 'owed' | 'owe' | 'neutral'
}

export function RecentActivity({ items, users, groups, me, now }: Props) {
  const groupById = Object.fromEntries(groups.map((g) => [g.id, g]))
  const name = (id: string) => (id === me ? 'You' : firstName(users[id].name))

  const rows: Row[] = items.map((a) => {
    const base = { id: a.id, group: groupById[a.groupId], day: relativeDay(a.createdAt, now) }
    if (a.type === 'settlement') {
      const received = a.to === me
      return {
        ...base,
        icon: <ArrowLeftRight size={17} />,
        title: `${name(a.from)} paid ${received ? 'you' : name(a.to)}`,
        detail: 'Payment',
        effectLabel: received ? 'you received' : 'you paid',
        effectAmount: a.amount,
        tone: 'neutral',
      }
    }
    const Icon = categoryIcon[a.category]
    const effect = yourEffect(a, me)
    return {
      ...base,
      icon: <Icon size={17} />,
      title: a.title,
      detail: `${name(a.paidBy)} paid ${money(a.amount)}`,
      effectLabel: effect.kind === 'lent' ? 'you lent' : effect.kind === 'borrowed' ? 'you borrowed' : 'not involved',
      effectAmount: effect.kind === 'none' ? undefined : effect.amount,
      tone: effect.kind === 'lent' ? 'owed' : effect.kind === 'borrowed' ? 'owe' : 'neutral',
    }
  })

  return (
    <Card padded={false}>
      {rows.length === 0 ? (
        <p className={styles.empty}>No activity yet. Add your first expense to get started.</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.id} className={styles.row}>
              <span className={styles.icon} aria-hidden>
                {r.icon}
              </span>
              <span className={styles.main}>
                <strong>{r.title}</strong>
                <span>{r.detail}</span>
                <span className={styles.compactMeta}>
                  {r.group.name} · {r.day}
                </span>
              </span>
              <span className={styles.group}>
                <span aria-hidden>{r.group.emoji}</span> {r.group.name}
              </span>
              <span className={styles.day}>{r.day}</span>
              <span className={styles.effect}>
                <span>{r.effectLabel}</span>
                {r.effectAmount !== undefined && (
                  <strong className="tabular" data-tone={r.tone}>
                    {money(r.effectAmount)}
                  </strong>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

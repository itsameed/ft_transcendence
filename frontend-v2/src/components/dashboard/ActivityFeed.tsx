import { HandCoins } from 'lucide-react'
import { useState } from 'react'
import type { Activity, Group, User } from '../../types'
import { yourEffect } from '../../lib/balances'
import { categoryIcon } from '../../lib/categories'
import { firstName, money, relativeDay, time } from '../../lib/format'
import { Card } from '../ui/Card'
import styles from './ActivityFeed.module.css'

type Filter = 'all' | 'expense' | 'settlement'

interface Props {
  items: Activity[]
  users: Record<string, User>
  groups: Group[]
  me: string
  now: Date
}

export function ActivityFeed({ items, users, groups, me, now }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const groupById = Object.fromEntries(groups.map((g) => [g.id, g]))
  const name = (id: string) => (id === me ? 'You' : firstName(users[id].name))

  const visible = items.filter((a) => filter === 'all' || a.type === filter)
  const days = new Map<string, Activity[]>()
  for (const a of visible) {
    const day = relativeDay(a.createdAt, now)
    days.set(day, [...(days.get(day) ?? []), a])
  }

  return (
    <Card
      title="Recent activity"
      action={
        <div className={styles.tabs} role="tablist" aria-label="Filter activity">
          {(['all', 'expense', 'settlement'] as const).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? styles.tabActive : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : 'Payments'}
            </button>
          ))}
        </div>
      }
    >
      <div className={styles.feed}>
        {[...days].map(([day, list]) => (
          <div key={day}>
            <p className={styles.day}>{day}</p>
            <ul className={styles.list}>
              {list.map((a) => {
                const group = groupById[a.groupId]
                if (a.type === 'settlement') {
                  const received = a.to === me
                  return (
                    <li key={a.id} className={styles.item}>
                      <span className={`${styles.icon} ${styles.iconSettle}`}>
                        <HandCoins size={18} />
                      </span>
                      <div className={styles.body}>
                        <strong>
                          {name(a.from)} paid {a.to === me ? 'you' : name(a.to)}
                        </strong>
                        <span>
                          {group.emoji} {group.name} · {time(a.createdAt)}
                        </span>
                      </div>
                      <div className={styles.effect} data-dir="neutral">
                        <span>{received ? 'you received' : 'you paid'}</span>
                        <strong>{money(a.amount)}</strong>
                      </div>
                    </li>
                  )
                }
                const Icon = categoryIcon[a.category]
                const effect = yourEffect(a, me)
                return (
                  <li key={a.id} className={styles.item}>
                    <span className={styles.icon}>
                      <Icon size={18} />
                    </span>
                    <div className={styles.body}>
                      <strong>{a.title}</strong>
                      <span>
                        {name(a.paidBy)} paid {money(a.amount)} · {group.emoji} {group.name}
                      </span>
                    </div>
                    <div className={styles.effect} data-dir={effect.kind === 'lent' ? 'pos' : effect.kind === 'borrowed' ? 'neg' : 'neutral'}>
                      <span>{effect.kind === 'lent' ? 'you lent' : effect.kind === 'borrowed' ? 'you borrowed' : 'not involved'}</span>
                      {effect.kind !== 'none' && <strong>{money(effect.amount)}</strong>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {visible.length === 0 && <p className={styles.empty}>Nothing here yet.</p>}
      </div>
    </Card>
  )
}

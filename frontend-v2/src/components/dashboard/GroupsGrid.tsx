import { ChevronRight, Plus } from 'lucide-react'
import type { Group, User } from '../../types'
import { dateRange, daysUntil, money } from '../../lib/format'
import { AvatarStack } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import styles from './GroupsGrid.module.css'

const kindLabel = { trip: 'Trip', home: 'Household', event: 'Recurring', other: 'Group' }

function badge(group: Group, now: Date): { text: string; tone: 'accent' | 'muted' } | null {
  if (!group.startDate || !group.endDate) return null
  const start = daysUntil(group.startDate, now)
  const end = daysUntil(group.endDate, now)
  if (start > 0) return { text: `In ${start} days`, tone: 'accent' }
  if (end >= 0) return { text: 'Happening now', tone: 'accent' }
  return { text: 'Trip ended', tone: 'muted' }
}

interface Props {
  groups: Group[]
  users: Record<string, User>
  now: Date
}

export function GroupsGrid({ groups, users, now }: Props) {
  return (
    <Card
      title="Your groups"
      subtitle={`${groups.length} active`}
      action={
        <Button size="sm" variant="ghost" icon={<Plus />}>
          New group
        </Button>
      }
    >
      <div className={styles.grid}>
        {groups.map((g) => {
          const b = badge(g, now)
          const dir = g.yourBalance > 0 ? 'pos' : g.yourBalance < 0 ? 'neg' : 'zero'
          return (
            <a key={g.id} href="#" className={styles.group}>
              <div className={styles.top}>
                <span className={styles.emoji} aria-hidden>{g.emoji}</span>
                <div className={styles.titles}>
                  <strong>{g.name}</strong>
                  <span>
                    {kindLabel[g.kind]}
                    {g.startDate && g.endDate ? ` · ${dateRange(g.startDate, g.endDate)}` : ` · ${g.memberIds.length} people`}
                  </span>
                </div>
                {b && (
                  <span className={styles.badge} data-tone={b.tone}>
                    {b.text}
                  </span>
                )}
              </div>

              <div className={styles.balance} data-dir={dir}>
                <span>{dir === 'pos' ? 'You are owed' : dir === 'neg' ? 'You owe' : 'Settled up'}</span>
                {dir !== 'zero' && <strong>{money(g.yourBalance)}</strong>}
              </div>

              <div className={styles.bottom}>
                <AvatarStack users={g.memberIds.map((id) => users[id])} size={26} />
                <span className={styles.total}>
                  {money(g.totalSpent)} total
                  <ChevronRight size={15} />
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </Card>
  )
}

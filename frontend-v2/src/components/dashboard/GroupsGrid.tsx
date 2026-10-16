import type { Group } from '../../types'
import { dateRange, daysUntil, money } from '../../lib/format'
import styles from './GroupsGrid.module.css'

/** One quiet line of context under the group name. */
function describe(group: Group, now: Date): string {
  const people = `${group.memberIds.length} people`
  if (!group.startDate || !group.endDate) return people
  const range = dateRange(group.startDate, group.endDate)
  const startsIn = daysUntil(group.startDate, now)
  if (startsIn > 0) return `${range} · in ${startsIn} days`
  if (daysUntil(group.endDate, now) >= 0) return `${range} · happening now`
  return `${range} · ${people}`
}

export function GroupsGrid({ groups, now }: { groups: Group[]; now: Date }) {
  return (
    <div className={styles.grid}>
      {groups.map((g) => {
        const tone = g.yourBalance > 0 ? 'owed' : g.yourBalance < 0 ? 'owe' : 'settled'
        return (
          <a key={g.id} href="#" className={styles.tile}>
            <span className={styles.emoji} aria-hidden>
              {g.emoji}
            </span>
            <span className={styles.titles}>
              <strong>{g.name}</strong>
              <span>{describe(g, now)}</span>
            </span>
            <span className={styles.balance}>
              <span>{tone === 'owed' ? 'You’re owed' : tone === 'owe' ? 'You owe' : 'All settled up'}</span>
              {tone !== 'settled' && (
                <strong className="tabular" data-tone={tone}>
                  {money(g.yourBalance)}
                </strong>
              )}
            </span>
          </a>
        )
      })}
    </div>
  )
}

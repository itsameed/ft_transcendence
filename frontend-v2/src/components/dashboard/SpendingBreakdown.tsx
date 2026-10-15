import type { CategorySpend } from '../../types'
import { categoryIcon } from '../../lib/categories'
import { categoryLabel, money } from '../../lib/format'
import { Card } from '../ui/Card'
import styles from './SpendingBreakdown.module.css'

/** Single-series bar list: your share of spending this month, by category. */
export function SpendingBreakdown({ data, month }: { data: CategorySpend[]; month: string }) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount)
  const total = sorted.reduce((sum, d) => sum + d.amount, 0)
  const max = Math.max(...sorted.map((d) => d.amount), 1)

  return (
    <Card title={`Your share · ${month}`} subtitle="What you actually spent, after splitting">
      <p className={styles.total}>{money(total)}</p>
      <ul className={styles.list}>
        {sorted.map((d) => {
          const Icon = categoryIcon[d.category]
          const pct = Math.round((d.amount / total) * 100)
          return (
            <li key={d.category} className={styles.row} title={`${categoryLabel[d.category]}: ${money(d.amount)} (${pct}%)`}>
              <span className={styles.label}>
                <Icon size={15} />
                {categoryLabel[d.category]}
              </span>
              <span className={`${styles.value} tabular`}>
                {money(d.amount)}
                <em>{pct}%</em>
              </span>
              <span className={styles.track}>
                <span className={styles.bar} style={{ width: `${(d.amount / max) * 100}%` }} />
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

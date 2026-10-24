import type { CSSProperties } from 'react'
import { Card } from './Card'
import { formatMoney } from '../lib/format'
import type { MonthSpend } from '../types'
import './SpendingCard.css'

export function SpendingCard({ months }: { months: MonthSpend[] }) {
  const current = months[months.length - 1]
  const previous = months[months.length - 2]
  const change = Math.round(((current.amount - previous.amount) / previous.amount) * 100)
  const max = Math.max(...months.map((m) => m.amount))

  return (
    <Card className="spending">
      <p className="eyebrow">Your spending · {current.month}</p>
      <p className="spending__amount">{formatMoney(current.amount)}</p>
      <p className={`spending__change tone-${change > 0 ? 'negative' : 'positive'}`}>
        {change > 0 ? '▲' : '▼'} {Math.abs(change)}% vs {previous.month}
      </p>

      <div className="chart" role="img" aria-label={`Monthly spending, last ${months.length} months`}>
        {months.map((m, i) => (
          <div key={m.month} className="chart__col">
            <div
              className={`chart__bar ${i === months.length - 1 ? 'is-current' : ''}`}
              style={{ '--h': `${(m.amount / max) * 100}%`, '--i': i } as CSSProperties}
              title={formatMoney(m.amount)}
            />
            <span className="chart__label">{m.month}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

import { Card } from './Card'
import { Avatar } from './Avatar'
import { formatMoney } from '../lib/format'
import { me } from '../data/mock'
import type { Activity } from '../types'
import './ActivityCard.css'

function describe(a: Activity) {
  const who = a.actor.id === me.id ? 'You' : a.actor.name.split(' ')[0]
  if (a.kind === 'expense') return <><strong>{who}</strong> added “{a.title}”</>
  return <><strong>{who}</strong> {a.title}</>
}

function Amount({ a }: { a: Activity }) {
  if (a.yourShare === undefined) return null
  const positive = a.yourShare > 0
  return (
    <div className="activity__amount">
      <span className={positive ? 'tone-positive' : 'tone-negative'}>
        {positive ? '+' : '−'}
        {formatMoney(a.yourShare)}
      </span>
      <span className="activity__amount-sub">
        {a.kind === 'settlement' ? 'received' : positive ? 'you lent' : 'you owe'}
      </span>
    </div>
  )
}

export function ActivityCard({ items }: { items: Activity[] }) {
  return (
    <Card title="Recent activity" action="See all" className="activity">
      <ul className="list">
        {items.map((a) => (
          <li key={a.id} className="list__row">
            <Avatar user={a.actor} />
            <div className="list__body">
              <div className="list__title">{describe(a)}</div>
              <div className="list__sub">
                {a.group} · {a.time}
              </div>
            </div>
            <Amount a={a} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

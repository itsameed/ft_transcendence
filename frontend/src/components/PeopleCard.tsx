import { Card } from './Card'
import { Avatar } from './Avatar'
import { formatMoney } from '../lib/format'
import type { FriendBalance } from '../types'

export function PeopleCard({ balances }: { balances: FriendBalance[] }) {
  // Biggest amounts first: those are the ones worth acting on.
  const sorted = [...balances].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

  return (
    <Card title="Balances" action="All friends">
      <ul className="list">
        {sorted.map(({ friend, amount }) => (
          <li key={friend.id} className="list__row">
            <Avatar user={friend} />
            <div className="list__body">
              <div className="list__title">
                <strong>{friend.name}</strong>
              </div>
              <div className={`list__sub ${amount > 0 ? 'tone-positive' : 'tone-negative'}`}>
                {amount > 0 ? 'owes you' : 'you owe'} {formatMoney(amount)}
              </div>
            </div>
            <button type="button" className="btn btn--small btn--tinted pressable">
              {amount > 0 ? 'Remind' : 'Settle'}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

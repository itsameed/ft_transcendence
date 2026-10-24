import { Card } from './Card'
import { Icon } from './Icon'
import { formatMoney } from '../lib/format'
import type { FriendBalance } from '../types'
import './BalanceCard.css'

export function BalanceCard({ balances }: { balances: FriendBalance[] }) {
  const owed = balances.filter((b) => b.amount > 0).reduce((sum, b) => sum + b.amount, 0)
  const owe = balances.filter((b) => b.amount < 0).reduce((sum, b) => sum - b.amount, 0)
  const net = owed - owe
  const tone = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral'

  return (
    <Card className="balance">
      <div className="balance__glow" aria-hidden="true" />
      <p className="eyebrow">Net balance</p>
      <p className={`balance__amount tone-${tone}`}>
        {net < 0 && '−'}
        {formatMoney(net)}
      </p>
      <p className="balance__caption">
        {tone === 'positive' && 'Overall, friends owe you money.'}
        {tone === 'negative' && 'Overall, you owe your friends.'}
        {tone === 'neutral' && 'You’re all settled up.'}
      </p>

      <div className="balance__stats">
        <div className="stat">
          <span className="stat__icon tone-bg-positive">
            <Icon name="arrowDown" size={16} />
          </span>
          <div>
            <div className="stat__label">You’re owed</div>
            <div className="stat__value">{formatMoney(owed)}</div>
          </div>
        </div>
        <div className="stat">
          <span className="stat__icon tone-bg-negative">
            <Icon name="arrowUp" size={16} />
          </span>
          <div>
            <div className="stat__label">You owe</div>
            <div className="stat__value">{formatMoney(owe)}</div>
          </div>
        </div>
      </div>

      <div className="balance__actions">
        <button type="button" className="btn btn--primary pressable">
          <Icon name="check" size={18} />
          Settle up
        </button>
        <button type="button" className="btn btn--tinted pressable">
          <Icon name="bell" size={18} />
          Remind friends
        </button>
      </div>
    </Card>
  )
}

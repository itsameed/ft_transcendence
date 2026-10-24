import type { CSSProperties } from 'react'
import { AvatarStack } from './Avatar'
import { Icon } from './Icon'
import { formatMoney } from '../lib/format'
import type { Group } from '../types'
import './GroupCard.css'

function BalanceLabel({ value }: { value: number }) {
  if (value > 0) return <span className="tone-positive">you’re owed {formatMoney(value)}</span>
  if (value < 0) return <span className="tone-negative">you owe {formatMoney(value)}</span>
  return <span className="tone-neutral">settled up</span>
}

export function GroupCard({ group }: { group: Group }) {
  return (
    <button type="button" className="group-card glass pressable" style={{ '--tint': group.tint } as CSSProperties}>
      <div className="group-card__top">
        <span className="group-card__emoji">{group.emoji}</span>
        <span className="group-card__chevron">
          <Icon name="chevron" size={16} />
        </span>
      </div>

      <h3 className="group-card__name">{group.name}</h3>
      <p className="group-card__meta">
        {formatMoney(group.totalSpent)} total · {group.updated}
      </p>

      <div className="group-card__bottom">
        <AvatarStack users={group.members} />
        <span className="group-card__balance">
          <BalanceLabel value={group.yourBalance} />
        </span>
      </div>
    </button>
  )
}

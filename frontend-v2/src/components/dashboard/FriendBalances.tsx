import { Bell, Send } from 'lucide-react'
import type { FriendBalance, Group, User } from '../../types'
import { firstName, money } from '../../lib/format'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import styles from './FriendBalances.module.css'

interface Props {
  balances: FriendBalance[]
  users: Record<string, User>
  groups: Group[]
  onRemind: (user: User, amount: number) => void
  onPay: (user: User, amount: number) => void
}

/**
 * Diverging bar per friend: bars to the right of the center line = they owe you,
 * to the left = you owe them. Direction + wording carry the meaning, not just color.
 */
export function FriendBalances({ balances, users, groups, onRemind, onPay }: Props) {
  const sorted = [...balances].sort((a, b) => b.amount - a.amount)
  const max = Math.max(...sorted.map((b) => Math.abs(b.amount)), 1)

  return (
    <Card
      title="Balances with friends"
      subtitle="Simplified across all groups"
      className={styles.card}
      action={
        <div className={styles.legend} aria-hidden>
          <span><i data-dir="pos" /> Owes you</span>
          <span><i data-dir="neg" /> You owe</span>
        </div>
      }
    >
      <ul className={styles.list}>
        {sorted.map(({ userId, amount }) => {
          const user = users[userId]
          const owesYou = amount > 0
          const shared = groups.filter((g) => g.memberIds.includes(userId)).map((g) => `${g.emoji} ${g.name}`)
          const width = `${(Math.abs(amount) / max) * 50}%`
          return (
            <li key={userId} className={styles.row} tabIndex={0}>
              <div className={styles.head}>
                <Avatar user={user} size={30} />
                <div className={styles.who}>
                  <strong>{firstName(user.name)}</strong>
                  <span>{owesYou ? 'owes you' : 'you owe'}</span>
                </div>
                <span className={`${styles.amount} tabular`} data-dir={owesYou ? 'pos' : 'neg'}>
                  {money(amount, { signed: true })}
                </span>
                {owesYou ? (
                  <button className={styles.action} onClick={() => onRemind(user, amount)} aria-label={`Remind ${user.name}`} title="Send a reminder">
                    <Bell size={15} />
                  </button>
                ) : (
                  <button className={styles.action} onClick={() => onPay(user, -amount)} aria-label={`Pay ${user.name}`} title="Record a payment">
                    <Send size={15} />
                  </button>
                )}
              </div>
              <div className={styles.track}>
                <span className={styles.bar} data-dir={owesYou ? 'pos' : 'neg'} style={{ width }} />
              </div>
              <div className={styles.tooltip} role="tooltip">
                <strong>{owesYou ? `${firstName(user.name)} owes you ${money(amount)}` : `You owe ${firstName(user.name)} ${money(amount)}`}</strong>
                <span>Shared groups</span>
                {shared.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

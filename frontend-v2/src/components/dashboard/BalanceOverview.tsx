import type { FriendBalance, User } from '../../types'
import { summarize } from '../../lib/balances'
import { money } from '../../lib/format'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import styles from './BalanceOverview.module.css'

interface Props {
  balances: FriendBalance[]
  users: Record<string, User>
  groupCount: number
  onSettle: (user: User, amount: number) => void
  onRemind: (user: User, amount: number) => void
}

/**
 * The one thing people open the app for: where do I stand, and with whom.
 * The net figure on top, then two plain lists. The column headings carry
 * the meaning, so the amounts themselves can stay neutral.
 */
export function BalanceOverview({ balances, users, groupCount, onSettle, onRemind }: Props) {
  const { net, owedToYou, youOwe } = summarize(balances)
  const owing = balances.filter((b) => b.amount < 0).sort((a, b) => a.amount - b.amount)
  const owed = balances.filter((b) => b.amount > 0).sort((a, b) => b.amount - a.amount)

  return (
    <Card padded={false}>
      <div className={styles.summary}>
        <p className={styles.label}>
          {net > 0 ? 'Overall, you’re owed' : net < 0 ? 'Overall, you owe' : 'You’re all settled up'}
        </p>
        <p className={styles.net}>{money(net)}</p>
        <p className={styles.meta}>
          Debts are simplified across your {groupCount} groups, so everyone makes as few payments as possible.
        </p>
      </div>

      <div className={styles.columns}>
        <Column
          title="You owe"
          tone="owe"
          total={youOwe}
          rows={owing}
          users={users}
          empty="You don’t owe anyone right now."
          action="Settle up"
          actionLabel={(u) => `Settle up with ${u.name}`}
          onAction={onSettle}
        />
        <Column
          title="Owed to you"
          tone="owed"
          total={owedToYou}
          rows={owed}
          users={users}
          empty="Nobody owes you right now."
          action="Remind"
          actionLabel={(u) => `Remind ${u.name}`}
          onAction={onRemind}
        />
      </div>
    </Card>
  )
}

interface ColumnProps {
  title: string
  tone: 'owe' | 'owed'
  total: number
  rows: FriendBalance[]
  users: Record<string, User>
  empty: string
  action: string
  actionLabel: (user: User) => string
  onAction: (user: User, amount: number) => void
}

function Column({ title, tone, total, rows, users, empty, action, actionLabel, onAction }: ColumnProps) {
  return (
    <div className={styles.column}>
      <div className={styles.columnHead}>
        <h3>
          <span className={styles.dot} data-tone={tone} aria-hidden />
          {title}
        </h3>
        <span className="tabular">{money(total)}</span>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul className={styles.rows}>
          {rows.map(({ userId, amount }) => {
            const user = users[userId]
            return (
              <li key={userId} className={styles.row}>
                <Avatar user={user} size={34} />
                <span className={styles.name}>{user.name}</span>
                <span className={`${styles.amount} tabular`}>{money(amount)}</span>
                <Button size="sm" variant="secondary" className={styles.action} onClick={() => onAction(user, Math.abs(amount))} aria-label={actionLabel(user)}>
                  {action}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

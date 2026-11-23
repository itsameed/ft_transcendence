import { ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Activity, Group, User } from '../../types'
import { kindTint } from '../../lib/activity'
import { money, relativeDay } from '../../lib/format'
import { iconForKind } from '../../lib/GroupKinds'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import styles from './GroupsList.module.css'

interface Props {
  groups: Group[]
  users: Record<string, User>
  items: Activity[]
  now: Date
}

/** A compact, scannable list of groups for the dashboard's side column. */
export function GroupsList({ groups, users, items, now }: Props) {
  const lastSeen = new Map<string, string>()
  for (const a of items) if (!lastSeen.has(a.groupId)) lastSeen.set(a.groupId, a.createdAt)

  if (groups.length === 0) {
    return (
      <Card padded={false}>
        <Link to="/groups" className={styles.emptyCta}>
          <span className={styles.plus} aria-hidden><Plus size={18} aria-hidden /></span>
          <span>
            <strong>Create your first group</strong>
            <small>A trip, a flat, a Friday match…</small>
          </span>
        </Link>
      </Card>
    )
  }

  return (
    <Card padded={false}>
      <ul className={styles.list}>
        {groups.map((g) => {
          const Icon = iconForKind(g.kind)
          const tone = g.yourBalance > 0 ? 'owed' : g.yourBalance < 0 ? 'owe' : 'settled'
          const seen = lastSeen.get(g.id)
          return (
            <li key={g.id}>
              <Link to={`/groups/${g.id}`} className={styles.row}>
                <span className={`${styles.icon} tint`} data-tint={kindTint(g.kind)} aria-hidden>
                  <Icon size={18} strokeWidth={1.7} aria-hidden />
                </span>
                <span className={styles.main}>
                  <strong title={g.name}>{g.name}</strong>
                  <span className={styles.meta}>
                    <span className={styles.stack} aria-hidden>
                      {g.memberIds.slice(0, 3).map((id) => (
                        <Avatar key={id} user={users[id] ?? { id, name: '?', email: '' }} size={16} />
                      ))}
                    </span>
                    {g.memberIds.length} {g.memberIds.length === 1 ? 'person' : 'people'}
                    {seen && <> · {relativeDay(seen, now)}</>}
                  </span>
                </span>
                <span className={styles.badge} data-tone={tone}>
                  {tone === 'owed' ? `+${money(g.yourBalance)}` : tone === 'owe' ? `−${money(g.yourBalance)}` : 'Settled'}
                </span>
                <ChevronRight size={16} className={styles.chev} aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

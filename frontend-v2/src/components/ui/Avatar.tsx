import type { CSSProperties } from 'react'
import type { User } from '../../types'
import { initials } from '../../lib/format'
import styles from './Avatar.module.css'

// Same user -> same color, everywhere.
function hueFor(id: string): number {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const hues = [12, 38, 150, 172, 200, 222, 262, 320]
  return hues[hash % hues.length]
}

interface Props {
  user: User
  size?: number
  ring?: boolean
}

export function Avatar({ user, size = 32, ring = false }: Props) {
  const style = { '--hue': hueFor(user.id), '--size': `${size}px` } as CSSProperties
  return (
    <span className={`${styles.avatar} ${ring ? styles.ring : ''}`} style={style} title={user.name}>
      {initials(user.name)}
    </span>
  )
}

export function AvatarStack({ users, max = 4, size = 28 }: { users: User[]; max?: number; size?: number }) {
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  return (
    <span className={styles.stack}>
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} ring />
      ))}
      {extra > 0 && (
        <span className={`${styles.avatar} ${styles.ring} ${styles.more}`} style={{ '--size': `${size}px` } as CSSProperties}>
          +{extra}
        </span>
      )}
    </span>
  )
}

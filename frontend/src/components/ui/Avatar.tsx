import type { CSSProperties } from 'react'
import type { User } from '../../types'
import { initials } from '../../lib/format'
import styles from './Avatar.module.css'

/** Neutral monogram. The name always sits next to it, so it's hidden from screen readers. */
export function Avatar({ user, size = 32 }: { user: User; size?: number }) {
  return (
    <span className={styles.avatar} style={{ '--size': `${size}px` } as CSSProperties} title={user.name} aria-hidden>
      {initials(user.name)}
    </span>
  )
}

import { useEffect, useState, type CSSProperties } from 'react'
import type { User } from '../../types'
import { initials } from '../../lib/format'
import styles from './Avatar.module.css'

/** Photo when the user has one, monogram otherwise. The name always sits next to it. */
export function Avatar({ user, size = 32 }: { user: User; size?: number }) {
  const [broken, setBroken] = useState(false)

  // A new URL deserves a fresh attempt; otherwise one bad load sticks forever.
  useEffect(() => setBroken(false), [user.avatar])

  const showImage = Boolean(user.avatar) && !broken

  return (
    <span
      className={`${styles.avatar} ${showImage ? styles.photo : ''}`}
      style={{ '--size': `${size}px` } as CSSProperties}
      title={user.name}
      aria-hidden
    >
      {showImage ? (
        <img src={user.avatar!} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
      ) : (
        initials(user.name)
      )}
    </span>
  )
}

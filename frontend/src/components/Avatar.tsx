import type { CSSProperties } from 'react'
import type { User } from '../types'
import { initials } from '../lib/format'
import './Avatar.css'

export function Avatar({ user, size = 36 }: { user: User; size?: number }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, '--avatar': user.color } as CSSProperties}
      title={user.name}
    >
      {initials(user.name)}
    </span>
  )
}

export function AvatarStack({ users, max = 4 }: { users: User[]; max?: number }) {
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  return (
    <span className="avatar-stack">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={26} />
      ))}
      {extra > 0 && <span className="avatar avatar--more">+{extra}</span>}
    </span>
  )
}

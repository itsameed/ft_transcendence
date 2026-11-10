import { LayoutGrid, MessageSquare, Settings, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { User } from '../../types'
import { Avatar } from '../ui/Avatar'
import { NotificationBell } from './NotificationBell'
import styles from './Sidebar.module.css'

export const NAV = [
  { label: 'Dashboard', icon: LayoutGrid, to: '/dashboard' },
  { label: 'Groups & Friends', icon: UsersRound, to: '/groups' },
  { label: 'Chat', icon: MessageSquare, to: '/chat' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

export function Logo() {
  return (
    <span className={styles.logo}>
      <span className={styles.mark} aria-hidden>
        <svg viewBox="0 0 24 24" width="15" height="15">
          <path d="M6 7h12M12 7v11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      Tally
    </span>
  )
}

export function Sidebar({ me }: { me: User }) {
  return (
    <aside className={styles.sidebar}>
      <Logo />

      <nav className={styles.nav} aria-label="Main">
        {NAV.map(({ label, icon: Icon, to }) => (
          <NavLink key={label} to={to} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
        <NotificationBell userId={me.id} />
      </nav>

      <div className={styles.footer}>
        <NavLink to="/profile" className={({ isActive }) => `${styles.me} ${isActive ? styles.active : ''}`}>
          <Avatar user={me} size={32} />
          <span className={styles.meText}>
            <strong>{me.name}</strong>
            <span>{me.email}</span>
          </span>
        </NavLink>
      </div>
    </aside>
  )
}

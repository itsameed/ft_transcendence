import { LayoutGrid, MessageSquare, Moon, Settings, Split, Sun, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { User } from '../../types'
import { useTheme } from '../../lib/useTheme'
import { Avatar } from '../ui/Avatar'
import { LogoutButton } from './LogoutButton'
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
        <Split size={15} strokeWidth={2.2} />
      </span>
      Splitify
    </span>
  )
}

export function Sidebar({ me }: { me: User }) {
  const { dark, toggle } = useTheme()
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
        <button type="button" className={styles.themeToggle} onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={dark}>
          {dark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <NavLink to="/profile" className={({ isActive }) => `${styles.me} ${isActive ? styles.active : ''}`}>
          <Avatar user={me} size={32} />
          <span className={styles.meText}>
            <strong>{me.name}</strong>
            <span>{me.email}</span>
          </span>
        </NavLink>
        <LogoutButton />
      </div>
    </aside>
  )
}

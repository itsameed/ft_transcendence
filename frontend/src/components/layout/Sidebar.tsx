import { LayoutGrid, MessageSquare, Moon, Settings, ShieldCheck, Split, Sun, UsersRound } from 'lucide-react'
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

function AdminLink({ me }: { me: User }) {
  if (me.role !== 'admin') return null

  return (
    <NavLink to="/admin" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
      <ShieldCheck size={18} strokeWidth={1.75} aria-hidden />
      Admin panel
    </NavLink>
  )
}

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
            <Icon size={18} strokeWidth={1.75} aria-hidden />
            {label}
          </NavLink>
        ))}
        <AdminLink me={me} />
        <NotificationBell userId={me.id} />
      </nav>

      <div className={styles.footer}>
        {/* A toggle keeps one fixed name; aria-pressed says whether it's on. */}
        <button type="button" className={styles.themeToggle} onClick={toggle} aria-pressed={dark}>
          {dark ? <Sun size={18} strokeWidth={1.75} aria-hidden /> : <Moon size={18} strokeWidth={1.75} aria-hidden />}
          <span aria-hidden>{dark ? 'Light mode' : 'Dark mode'}</span>
          <span className="visually-hidden">Dark mode</span>
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

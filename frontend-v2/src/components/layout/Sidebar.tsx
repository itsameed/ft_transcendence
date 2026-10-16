import { Activity, LayoutGrid, Settings, Users, UsersRound } from 'lucide-react'
import type { User } from '../../types'
import { Avatar } from '../ui/Avatar'
import styles from './Sidebar.module.css'

export const NAV = [
  { label: 'Dashboard', icon: LayoutGrid, active: true },
  { label: 'Groups', icon: UsersRound },
  { label: 'Friends', icon: Users },
  { label: 'Activity', icon: Activity },
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
        {NAV.map(({ label, icon: Icon, active }) => (
          <a key={label} href="#" className={`${styles.link} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </a>
        ))}
      </nav>

      <div className={styles.footer}>
        <a href="#" className={styles.link}>
          <Settings size={18} strokeWidth={1.75} />
          Settings
        </a>
        <a href="#" className={styles.me}>
          <Avatar user={me} size={32} />
          <span className={styles.meText}>
            <strong>{me.name}</strong>
            <span>{me.email}</span>
          </span>
        </a>
      </div>
    </aside>
  )
}

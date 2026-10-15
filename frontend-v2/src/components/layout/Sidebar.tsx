import { Activity, LayoutGrid, Settings, Users, UsersRound } from 'lucide-react'
import type { Group, User } from '../../types'
import { money } from '../../lib/format'
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
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M6 7h12M12 7v11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      Tally
    </span>
  )
}

export function Sidebar({ me, groups }: { me: User; groups: Group[] }) {
  return (
    <aside className={styles.sidebar}>
      <Logo />

      <nav className={styles.nav} aria-label="Main">
        {NAV.map(({ label, icon: Icon, active }) => (
          <a key={label} href="#" className={`${styles.link} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={18} strokeWidth={2} />
            {label}
          </a>
        ))}
      </nav>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Your groups</p>
        {groups.map((g) => (
          <a key={g.id} href="#" className={styles.group}>
            <span className={styles.emoji} aria-hidden>{g.emoji}</span>
            <span className={styles.groupName}>{g.name}</span>
            <span
              className={styles.groupBalance}
              data-dir={g.yourBalance > 0 ? 'pos' : g.yourBalance < 0 ? 'neg' : 'zero'}
              title={g.yourBalance >= 0 ? `Group owes you ${money(g.yourBalance)}` : `You owe ${money(g.yourBalance)}`}
            />
          </a>
        ))}
      </div>

      <div className={styles.footer}>
        <a href="#" className={styles.link}>
          <Settings size={18} />
          Settings
        </a>
        <div className={styles.me}>
          <Avatar user={me} size={34} />
          <div className={styles.meText}>
            <strong>{me.name}</strong>
            <span>{me.email}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

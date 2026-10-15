import { Bell, HandCoins, Moon, Plus, Search, Sun } from 'lucide-react'
import { Button } from '../ui/Button'
import { Logo } from './Sidebar'
import styles from './Topbar.module.css'

interface Props {
  firstName: string
  today: Date
  dark: boolean
  onToggleTheme: () => void
  onAdd: () => void
  onSettle: () => void
}

export function Topbar({ firstName, today, dark, onToggleTheme, onAdd, onSettle }: Props) {
  return (
    <header className={styles.topbar}>
      <div className={styles.mobileLogo}>
        <Logo />
      </div>
      <div className={styles.greeting}>
        <p className={styles.date}>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1>Hey {firstName} 👋</h1>
      </div>

      <div className={styles.actions}>
        <label className={styles.search}>
          <Search size={16} />
          <span className="visually-hidden">Search</span>
          <input placeholder="Search expenses, friends…" />
          <kbd>/</kbd>
        </label>
        <button className={styles.iconButton} onClick={onToggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className={styles.iconButton} aria-label="Notifications, 2 unread">
          <Bell size={18} />
          <span className={styles.dot} />
        </button>
        <Button variant="secondary" icon={<HandCoins />} onClick={onSettle} className={styles.hideSm}>
          Settle up
        </Button>
        <Button variant="primary" icon={<Plus />} onClick={onAdd} className={styles.hideSm}>
          Add expense
        </Button>
      </div>
    </header>
  )
}

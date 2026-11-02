import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { NAV } from './Sidebar'
import styles from './MobileNav.module.css'

export function MobileNav({ onAdd }: { onAdd: () => void }) {
  const [first, second, ...rest] = NAV
  const item = ({ label, icon: Icon, to }: (typeof NAV)[number]) => (
    <NavLink key={label} to={to} className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
      <Icon size={20} strokeWidth={1.75} />
      <span>{label}</span>
    </NavLink>
  )
  return (
    <nav className={styles.bar} aria-label="Main">
      {item(first)}
      {item(second)}
      <button className={styles.fab} onClick={onAdd} aria-label="Add expense">
        <Plus size={22} strokeWidth={2.2} />
      </button>
      {rest.map(item)}
    </nav>
  )
}

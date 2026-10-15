import { Plus } from 'lucide-react'
import { NAV } from './Sidebar'
import styles from './MobileNav.module.css'

export function MobileNav({ onAdd }: { onAdd: () => void }) {
  const [first, second, ...rest] = NAV
  const item = ({ label, icon: Icon, active }: (typeof NAV)[number]) => (
    <a key={label} href="#" className={`${styles.item} ${active ? styles.active : ''}`}>
      <Icon size={20} />
      <span>{label}</span>
    </a>
  )
  return (
    <nav className={styles.bar} aria-label="Main">
      {item(first)}
      {item(second)}
      <button className={styles.fab} onClick={onAdd} aria-label="Add expense">
        <Plus size={24} strokeWidth={2.4} />
      </button>
      {rest.map(item)}
    </nav>
  )
}

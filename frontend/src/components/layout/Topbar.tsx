import { Plus } from 'lucide-react'
import { greeting } from '../../lib/format'
import { Button } from '../ui/Button'
import { Logo } from './Sidebar'
import styles from './Topbar.module.css'

interface Props {
  firstName: string
  today: Date
  onAdd: () => void
}

export function Topbar({ firstName, today, onAdd }: Props) {
  return (
    <header className={styles.topbar}>
      <div className={styles.mobileBrand}>
        <Logo />
      </div>

      <div className={styles.greeting}>
        <h1>
          {greeting(today)}, {firstName}
        </h1>
        <p>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" icon={<Plus />} onClick={onAdd} className={styles.add} title="Add expense (N)">
          Add expense
        </Button>
      </div>
    </header>
  )
}

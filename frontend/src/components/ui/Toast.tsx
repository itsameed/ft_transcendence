import { CheckCircle2 } from 'lucide-react'
import styles from './Toast.module.css'

export function Toast({ message }: { message: string | null }) {
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {message && (
        <div className={styles.toast} key={message}>
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}
    </div>
  )
}

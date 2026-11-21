import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import styles from './Toast.module.css'

export type ToastTone = 'success' | 'info' | 'error'

interface Props {
  message: string | null
  tone?: ToastTone
  duration?: number
  onDismiss: () => void
}

export function Toast({ message, tone = 'info', duration = 3000, onDismiss }: Props) {
  const dismissRef = useRef(onDismiss)

  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => dismissRef.current(), duration)
    return () => window.clearTimeout(timer)
  }, [message, duration])

  if (!message) return null

  const Icon = tone === 'error' ? AlertCircle : tone === 'info' ? Info : CheckCircle2

  return (
    <div className={styles.region} role={tone === 'error' ? 'alert' : 'status'} aria-live={tone === 'error' ? 'assertive' : 'polite'}>
      <div className={styles.toast} data-tone={tone}>
        <Icon className={styles.icon} size={18} aria-hidden="true" />
        <p>{message}</p>
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss notification">
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

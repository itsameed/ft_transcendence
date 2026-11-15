import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface Props {
  children: ReactNode
  className?: string
  /** Turn off when the content handles its own padding (e.g. full-width list rows). */
  padded?: boolean
}

export function Card({ children, className, padded = true }: Props) {
  return <div className={[styles.card, padded && styles.padded, className].filter(Boolean).join(' ')}>{children}</div>
}

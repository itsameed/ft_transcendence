import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface Props {
  children: ReactNode
  className?: string
  /** Turn off when the content handles its own padding (e.g. full-width list rows). */
  padded?: boolean
  /** @deprecated legacy header props, removed once every section uses <Section>. */
  title?: string
  subtitle?: string
  action?: ReactNode
}

export function Card({ children, className, padded = true, title, subtitle, action }: Props) {
  return (
    <div className={[styles.card, padded && styles.padded, className].filter(Boolean).join(' ')}>
      {(title || action) && (
        <header className={styles.legacyHeader}>
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </div>
  )
}

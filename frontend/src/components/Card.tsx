import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  action?: string
  className?: string
  children: ReactNode
}

export function Card({ title, action, className = '', children }: CardProps) {
  return (
    <section className={`card glass ${className}`}>
      {title && (
        <header className="card__header">
          <h2 className="card__title">{title}</h2>
          {action && (
            <button type="button" className="link-btn">
              {action}
            </button>
          )}
        </header>
      )}
      {children}
    </section>
  )
}

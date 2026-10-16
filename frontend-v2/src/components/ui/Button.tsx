import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  icon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', icon, children, className, ...rest }: Props) {
  return (
    <button
      className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

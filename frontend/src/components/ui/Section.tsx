import { ChevronRight } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import styles from './Section.module.css'

interface Props {
  title: string
  action?: ReactNode
  children: ReactNode
}

/** A titled block of the page. The heading sits on the page, the content brings its own surface. */
export function Section({ title, action, children }: Props) {
  const id = useId()
  return (
    <section className={styles.section} aria-labelledby={id}>
      <header className={styles.header}>
        <h2 id={id}>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

export function SectionLink({ children, href = '#' }: { children: ReactNode; href?: string }) {
  return (
    <a href={href} className={styles.link}>
      {children}
      <ChevronRight size={15} aria-hidden />
    </a>
  )
}

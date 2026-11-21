import { Moon, Split, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/layout/Sidebar'
import { useTheme } from '../lib/useTheme'
import styles from './Signup.module.css'

export function LegalPlaceholderPage({ title }: { title: string }) {
  const { dark, toggle } = useTheme()

  return (
    <div className={styles.authWrapper}>
      <header className={styles.topNav}>
        <Logo />
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
        </button>
      </header>
      <main className={styles.content}>
        <article className={styles.card}>
          <span className={styles.brandMark} aria-hidden="true">
            <Split size={18} strokeWidth={2.2} />
          </span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>This document has not been published yet.</p>
          <p className={styles.footer}>
            <Link to="/signup" className={styles.link}>Back to sign up</Link>
          </p>
        </article>
      </main>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { ArrowLeft, Moon, Receipt, Split, Sun } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import styles from './NotFound.module.css'

export function NotFoundPage() {
  const { dark, toggle } = useTheme()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="Splitify home">
          <span className={styles.brandMark} aria-hidden="true"><Split size={16} strokeWidth={2.2} aria-hidden /></span>
          <span>Splitify</span>
        </Link>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={dark}
        >
          {dark ? <Sun size={18} strokeWidth={1.75} aria-hidden /> : <Moon size={18} strokeWidth={1.75} aria-hidden />}
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.message} aria-labelledby="not-found-title">
          <div className={styles.receipt} aria-hidden="true">
            <Receipt size={25} strokeWidth={1.6} aria-hidden />
            <span className={styles.receiptRule} />
            <strong>404</strong>
          </div>
          <p className={styles.status}>Page not found</p>
          <h1 id="not-found-title">We couldn’t find that page.</h1>
          <p className={styles.description}>
            The address may be incorrect, or the page may have moved.
          </p>
          <Link to="/" className={styles.homeLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Splitify
          </Link>
        </section>
      </main>
    </div>
  )
}

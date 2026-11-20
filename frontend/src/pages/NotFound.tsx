import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Receipt, Split } from 'lucide-react'
import styles from './NotFound.module.css'

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found | Splitify'
    return () => { document.title = 'Splitify — Dashboard' }
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="Splitify home">
          <span className={styles.brandMark} aria-hidden="true"><Split size={16} strokeWidth={2.2} /></span>
          <span>Splitify</span>
        </Link>
      </header>

      <main className={styles.main}>
        <section className={styles.message} aria-labelledby="not-found-title">
          <div className={styles.receipt} aria-hidden="true">
            <Receipt size={25} strokeWidth={1.6} />
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

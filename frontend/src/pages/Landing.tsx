import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Moon,
  ShieldCheck,
  Split,
  Sun,
  Users,
} from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Sidebar'
import styles from './Landing.module.css'

export function Landing() {
  const { dark, toggle } = useTheme()

  return (
    <div className={styles.landing}>
      <header className={styles.nav}>
        <Logo />
        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={dark}
          >
            {dark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          </button>
          <div className={styles.authLinks}>
            <Link to="/login" className={styles.linkButton}>
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup" className={styles.linkButton}>
              <Button variant="primary" size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.pill}>
              <span className={styles.pillDot} />
              Shared money, made clear
            </p>
            <h1 className={styles.headline}>
              Good times shouldn’t come with <span>messy math.</span>
            </h1>
            <p className={styles.description}>
              Keep the group tab in one place. See who paid, what you owe, and when
              everyone’s square.
            </p>
            <div className={styles.ctaGroup}>
              <Link to="/signup" className={styles.linkButton}>
                <Button variant="primary" size="md" icon={<ArrowRight size={18} />} className={styles.primaryCta}>
                  Start splitting for free
                </Button>
              </Link>
              <Link to="/login" className={styles.linkButton}>
                <Button variant="secondary" size="md" className={styles.secondaryCta}>
                  Sign in
                </Button>
              </Link>
            </div>
            <p className={styles.reassurance}>Free to use. No card needed.</p>
          </div>

          <div
            className={styles.scene}
            role="img"
            aria-label="A preview of a group dinner tab, showing shared expenses and settled balances"
          >
            <div className={styles.sceneGlow} />
            <div className={`${styles.receipt} ${styles.receiptBack}`} aria-hidden="true">
              <span className={styles.receiptMark} />
              <span className={styles.receiptLine} />
              <span className={`${styles.receiptLine} ${styles.receiptLineShort}`} />
              <span className={styles.receiptTotal}>$48.00</span>
            </div>
            <div className={`${styles.receipt} ${styles.receiptFront}`} aria-hidden="true">
              <div className={styles.receiptTop}>
                <span className={styles.receiptIcon}><Split size={17} /></span>
                <span>FRIDAY DINNER</span>
                <span className={styles.receiptPeople}>4 people</span>
              </div>
              <div className={styles.dinnerTitle}>One table.<br />No loose ends.</div>
              <div className={styles.expenseRow}>
                <span className={styles.avatar}>M</span>
                <span className={styles.expenseName}>Mina paid</span>
                <span className={styles.expenseAmount}>$96.00</span>
              </div>
              <div className={styles.expenseRow}>
                <span className={`${styles.avatar} ${styles.avatarRust}`}>Y</span>
                <span className={styles.expenseName}>Your share</span>
                <span className={`${styles.expenseAmount} ${styles.expenseOwed}`}>$24.00</span>
              </div>
              <div className={styles.receiptBottom}>
                <span>YOUR BALANCE</span>
                <strong><ArrowDownLeft size={15} /> $24.00</strong>
              </div>
            </div>
            <div className={styles.settledSlip} aria-hidden="true">
              <span className={styles.settledCheck}><Check size={13} strokeWidth={2.5} /></span>
              <span><strong>All square</strong><small>Friday dinner</small></span>
              <ArrowUpRight size={16} />
            </div>
          </div>
        </section>

        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Less keeping score. More being there.</h2>
            <p className={styles.sectionSubtitle}>The little details of sharing money, taken care of.</p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Split size={22} strokeWidth={1.8} /></div>
              <h3 className={styles.featureName}>A fair split, every time</h3>
              <p className={styles.featureDesc}>
                Share evenly or set custom amounts for rent, groceries, and everything in between.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Users size={22} strokeWidth={1.8} /></div>
              <h3 className={styles.featureName}>Everyone stays in sync</h3>
              <p className={styles.featureDesc}>
                New expenses and payments show up for the whole group, so nothing gets lost in the chat.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><ShieldCheck size={22} strokeWidth={1.8} /></div>
              <h3 className={styles.featureName}>Clear from start to settled</h3>
              <p className={styles.featureDesc}>
                See exactly who owes what, then settle up without the awkward follow-up.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 Splitify. Made for sharing, not keeping score.</p>
      </footer>
    </div>
  )
}

export default Landing

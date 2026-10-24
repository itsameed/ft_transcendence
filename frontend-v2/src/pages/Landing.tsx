import { Link } from 'react-router-dom'
import { ArrowRight, Moon, ShieldCheck, Split, Sun, Users } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Sidebar'
import styles from './Landing.module.css'

export function Landing() {
  const { dark, toggle } = useTheme()

  return (
    <div className={styles.landing}>
      {/* Navigation */}
      <header className={styles.nav}>
        <Logo />
        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          </button>

          <div className={styles.authLinks}>
            <Link to="/login" className={styles.linkButton}>
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup" className={styles.linkButton}>
              <Button variant="primary" size="sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.pill}>
            <span className={styles.pillDot} />
            Split bills without the awkward math
          </div>

          <h1 className={styles.headline}>
            Effortless shared expenses for trips, housemates, and friends.
          </h1>

          <p className={styles.description}>
            Track who paid, see exact balances in real time, and settle up with one click.
            No spreadsheets, no forgotten debts.
          </p>

          <div className={styles.ctaGroup}>
            <Link to="/signup" className={styles.linkButton}>
              <Button variant="primary" size="md" icon={<ArrowRight size={18} />} className={styles.primaryCta}>
                Start splitting for free
              </Button>
            </Link>
            <Link to="/login" className={styles.linkButton}>
              <Button variant="secondary" size="md" className={styles.secondaryCta}>
                Sign in to your account
              </Button>
            </Link>
          </div>
        </section>

        {/* Live Mock UI Teaser */}
        <div className={styles.previewWrapper}>
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>Overview Preview</span>
              <span className={styles.previewBadge}>Live sync</span>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Net Balance</span>
                <span className={`${styles.statValue} ${styles.statGreen}`}>+$818.00</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>You are owed</span>
                <span className={`${styles.statValue} ${styles.statGreen}`}>$1,378.00</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>You owe</span>
                <span className={`${styles.statValue} ${styles.statRed}`}>$560.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Built for peace of mind</h2>
            <p className={styles.sectionSubtitle}>Simple, elegant, and designed to keep friendships intact.</p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Split size={22} strokeWidth={1.8} />
              </div>
              <h3 className={styles.featureName}>Smart Group Splitting</h3>
              <p className={styles.featureDesc}>
                Split evenly or specify custom amounts. Perfect for apartment rents, groceries, or road trips.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Users size={22} strokeWidth={1.8} />
              </div>
              <h3 className={styles.featureName}>Real-time Activity Feed</h3>
              <p className={styles.featureDesc}>
                Always know when someone adds an expense or logs a settlement, complete with instant notifications.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <ShieldCheck size={22} strokeWidth={1.8} />
              </div>
              <h3 className={styles.featureName}>Clean & Transparent</h3>
              <p className={styles.featureDesc}>
                No hidden tricks or complex UI. Clear balances with a modern, calm interface in dark or light mode.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Tally. Designed for effortless expense sharing.</p>
      </footer>
    </div>
  )
}

export default Landing

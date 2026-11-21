import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  Moon,
  Split,
  Sun,
  Waypoints,
  MessagesSquare,
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
              L7ssab saboon, made easy
            </p>
            <h1 className={styles.headline}>
              Clean accounts keep good friends.
            </h1>
            <p className={styles.description}>
              Split the riad, the taxi and the dinner in dirhams. See who paid, who owes
              what, and settle up with the fewest payments.
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
            aria-label="A preview of the Chefchaouen trip: Hiba paid the riad deposit of 1,200 MAD and your share is 300 MAD"
          >
            <div className={styles.sceneGlow} />
            <div className={`${styles.receipt} ${styles.receiptBack}`} aria-hidden="true">
              <span className={styles.receiptMark} />
              <span className={styles.receiptLine} />
              <span className={`${styles.receiptLine} ${styles.receiptLineShort}`} />
              <span className={styles.receiptTotal}>2,470 MAD</span>
            </div>
            <div className={`${styles.receipt} ${styles.receiptFront}`} aria-hidden="true">
              <div className={styles.receiptTop}>
                <span className={styles.receiptIcon}><Split size={17} /></span>
                <span>Chefchaouen trip</span>
                <span className={styles.receiptPeople}>4 people</span>
              </div>
              <div className={styles.dinnerTitle}>Riad deposit.<br />Everyone in.</div>
              <div className={styles.expenseRow}>
                <span className={styles.avatar}>H</span>
                <span className={styles.expenseName}>Hiba paid</span>
                <span className={styles.expenseAmount}>1,200 MAD</span>
              </div>
              <div className={styles.expenseRow}>
                <span className={`${styles.avatar} ${styles.avatarRust}`}>Y</span>
                <span className={styles.expenseName}>Your share</span>
                <span className={`${styles.expenseAmount} ${styles.expenseOwed}`}>300 MAD</span>
              </div>
              <div className={styles.receiptBottom}>
                <span>Your balance</span>
                <strong><ArrowDownLeft size={15} /> 300 MAD</strong>
              </div>
            </div>
            <div className={styles.settledSlip} aria-hidden="true">
              <span className={styles.settledCheck}><Check size={13} strokeWidth={2.5} /></span>
              <span><strong>All square</strong><small>Friday football</small></span>
              <ArrowUpRight size={16} />
            </div>
          </div>
        </section>

        <section className={styles.featuresSection} aria-labelledby="features-heading">
          <div className={styles.sectionHeader}>
            <h2 id="features-heading" className={styles.sectionTitle}>Less keeping score. More being there.</h2>
            <p className={styles.sectionSubtitle}>Everything the group needs to stay even, in one place.</p>
          </div>
          <div className={styles.featuresGrid}>
            <article className={styles.featureCard}>
              <div className={styles.featureVisual} aria-hidden="true">
                <div className={styles.flow}>
                  <span className={styles.flowBefore}>5 payments</span>
                  <ArrowRight size={16} />
                  <span className={styles.flowAfter}>2 payments</span>
                </div>
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureHead}>
                  <span className={styles.featureIcon}><Waypoints size={20} strokeWidth={1.8} /></span>
                  <h3 className={styles.featureName}>Fewer payments to settle</h3>
                </div>
                <p className={styles.featureDesc}>
                  Splitify combines debts across the group, so nobody pays back money that
                  someone else already owes them.
                </p>
              </div>
            </article>

            <article className={styles.featureCard}>
              <div className={styles.featureVisual} aria-hidden="true">
                <div className={styles.chat}>
                  <span className={styles.bubble}>Who has the taxi money?</span>
                  <span className={`${styles.bubble} ${styles.bubbleMine}`}>Yassine paid 450 MAD</span>
                </div>
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureHead}>
                  <span className={styles.featureIcon}><MessagesSquare size={20} strokeWidth={1.8} /></span>
                  <h3 className={styles.featureName}>Chat where the money is</h3>
                </div>
                <p className={styles.featureDesc}>
                  Every group has its own live chat. New expenses and payments show up for
                  everyone straight away.
                </p>
              </div>
            </article>

            <article className={styles.featureCard}>
              <div className={styles.featureVisual} aria-hidden="true">
                <div className={styles.chat}>
                  <span className={`${styles.bubble} ${styles.bubbleMine}`}>How much did we spend in total?</span>
                  <span className={styles.bubble}>2,470 MAD across 4 expenses.</span>
                </div>
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureHead}>
                  <span className={styles.featureIcon}><Bot size={20} strokeWidth={1.8} /></span>
                  <h3 className={styles.featureName}>Ask Splitify AI</h3>
                </div>
                <p className={styles.featureDesc}>
                  Get totals, breakdowns and a suggested way to settle, just by asking in plain words.
                </p>
              </div>
            </article>

            <article className={styles.featureCard}>
              <div className={styles.featureVisual} aria-hidden="true">
                <div className={styles.splitDemo}>
                  <span>Even</span>
                  <span className={styles.splitActive}>Custom</span>
                  <span className={styles.splitAmount}>160 / 300 / 45 MAD</span>
                </div>
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureHead}>
                  <span className={styles.featureIcon}><Split size={20} strokeWidth={1.8} /></span>
                  <h3 className={styles.featureName}>Split it your way</h3>
                </div>
                <p className={styles.featureDesc}>
                  Share evenly, or set exact amounts for rent, groceries and everything in between.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.howSection} aria-labelledby="how-it-works">
          <div className={styles.howHeader}>
            <h2 id="how-it-works" className={styles.howTitle}>From plans to paid, in three steps.</h2>
          </div>
          <ol className={styles.steps}>
            <li className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <h3>Create a group</h3>
                <p>Start a trip, a household, a football night, or anything you share.</p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <h3>Add an expense</h3>
                <p>Log who paid and choose an even or custom split.</p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <h3>Settle up</h3>
                <p>See the simplest payments and mark balances as paid.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className={styles.faqSection} aria-labelledby="faq-heading">
          <div className={styles.faqIntro}>
            <h2 id="faq-heading" className={styles.faqTitle}>Good to know</h2>
            <p className={styles.sectionSubtitle}>Short answers to the usual questions.</p>
          </div>
          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary>Is it free?</summary>
              <p>Yes. Creating groups, adding expenses, and settling balances is free. No card is needed.</p>
            </details>
            <details className={styles.faqItem}>
              <summary>Do friends need an account?</summary>
              <p>Friends can join your group from an invitation. An account makes it easier to keep expenses and balances in sync.</p>
            </details>
            <details className={styles.faqItem}>
              <summary>Does it work in dirhams?</summary>
              <p>Yes. Amounts are shown in MAD, so a riad deposit or a taxi is the same number you actually paid.</p>
            </details>
            <details className={styles.faqItem}>
              <summary>Does Splitify move money?</summary>
              <p>No. You pay each other the way you already do, by cash or bank transfer, then mark it as paid so the balance updates for everyone.</p>
            </details>
          </div>
        </section>

        <section className={styles.ctaBand} aria-labelledby="cta-heading">
          <div>
            <h2 id="cta-heading" className={styles.ctaTitle}>Make the next split the easy one.</h2>
            <p className={styles.ctaSub}>Create your first group in under a minute.</p>
          </div>
          <Link to="/signup" className={styles.linkButton}>
            <Button variant="secondary" size="md" icon={<ArrowRight size={18} />} className={styles.ctaButton}>
              Get started for free
            </Button>
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link to="/" className={styles.footerBrand} aria-label="Splitify home">
            <Logo />
          </Link>
          <nav className={styles.footerLinks} aria-label="Footer">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
          <p className={styles.copyright}>© 2026 Splitify. Made for sharing.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing

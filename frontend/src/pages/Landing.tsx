import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  Home,
  MessagesSquare,
  Plane,
  Trophy,
  UtensilsCrossed,
  Moon,
  Pause,
  Play,
  Split,
  Sun,
  Waypoints,
} from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { logout } from '../lib/auth'
import { useAuthStatus } from '../lib/useAuthStatus'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Sidebar'
import styles from './Landing.module.css'

/* ------------------------------------------------------------------
   Motion helpers
   Everything below falls back to its final, static state when the
   visitor prefers reduced motion.
------------------------------------------------------------------- */
function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

/** Counts a number up (or down) once `run` is true. */
function CountUp({
  to,
  from = 0,
  duration = 1200,
  delay = 0,
  run = true,
}: {
  to: number
  from?: number
  duration?: number
  delay?: number
  run?: boolean
}) {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(reduced ? to : from)
  useEffect(() => {
    if (reduced) {
      setValue(to)
      return
    }
    if (!run) {
      setValue(from)
      return
    }
    let raf = 0
    let startedAt = 0
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!startedAt) startedAt = now
        const p = Math.min((now - startedAt) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(Math.round(from + (to - from) * eased))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [to, from, duration, delay, run, reduced])
  return <>{value.toLocaleString('en-US')}</>
}

/** Types a string out letter by letter once `run` is true. */
function Typed({ text, delay = 0, speed = 55, run }: { text: string; delay?: number; speed?: number; run: boolean }) {
  const reduced = usePrefersReducedMotion()
  const [count, setCount] = useState(reduced ? text.length : 0)
  useEffect(() => {
    if (reduced) {
      setCount(text.length)
      return
    }
    if (!run) {
      setCount(0)
      return
    }
    let i = 0
    let interval = 0
    const timer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1
        setCount(i)
        if (i >= text.length) window.clearInterval(interval)
      }, speed)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
    }
  }, [text, delay, speed, run, reduced])
  return <>{text.slice(0, count)}</>
}

const delayStyle = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/* Who it's for: real situations with real-looking numbers. */
const USE_CASES = [
  { icon: Home, tint: 'lodging', title: 'Roommates', text: 'Rent, groceries and the Wi-Fi bill.', math: '299 MAD ÷ 3', each: '99.67 each' },
  { icon: Plane, tint: 'transport', title: 'Trips', text: 'Riads, grand taxis and the ferry.', math: '1,200 MAD ÷ 4', each: '300 each' },
  { icon: Trophy, tint: 'activities', title: 'Friday football', text: 'The pitch, every week, without chasing.', math: '700 MAD ÷ 14', each: '50 each' },
  { icon: UtensilsCrossed, tint: 'food', title: 'Dinners', text: 'One bill, many plates, custom splits.', math: '120 / 90 / 60', each: 'by what you ate' },
]

/* ------------------------------------------------------------------
   "How it works": a looping, self-playing walkthrough of the real flow
------------------------------------------------------------------- */
const STEP_MS = 5600

const STEPS = [
  { title: 'Create a group', windowTitle: 'New group', text: 'Start a trip, a household, a football night, or anything you share.' },
  { title: 'Add an expense', windowTitle: 'Add expense', text: 'Log who paid and choose an even or custom split.' },
  { title: 'Settle up', windowTitle: 'Settle up', text: 'See the simplest payments and mark balances as paid.' },
]

function SceneCreate({ run }: { run: boolean }) {
  const people = ['hiba', 'salma', 'yassine']
  return (
    <div className={styles.sceneBody}>
      <p className={styles.fieldLabel}>Group name</p>
      <div className={styles.field}>
        <Typed text="Chefchaouen Trip" delay={400} run={run} />
        <span className={styles.caret} aria-hidden="true" />
      </div>
      <p className={styles.fieldLabel}>Add people</p>
      <div className={styles.chips}>
        {people.map((name, i) => (
          <span key={name} className={styles.chip} style={delayStyle(1800 + i * 420)}>
            <span className={styles.chipAvatar}>{name[0].toUpperCase()}</span>
            {name}
          </span>
        ))}
      </div>
      <span className={styles.fakeButton} style={delayStyle(3300)}>Create group</span>
    </div>
  )
}

function SceneExpense({ run }: { run: boolean }) {
  const people = ['You', 'hiba', 'salma', 'yassine']
  return (
    <div className={styles.sceneBody}>
      <p className={styles.fieldLabel}>What was it for?</p>
      <div className={styles.field}>
        <Typed text="Riad deposit" delay={300} run={run} />
        <span className={styles.caret} aria-hidden="true" />
      </div>
      <div className={styles.rowFields}>
        <div>
          <p className={styles.fieldLabel}>Amount</p>
          <div className={styles.field}>
            <CountUp to={1200} delay={1100} duration={800} run={run} /> MAD
          </div>
        </div>
        <div>
          <p className={styles.fieldLabel}>Paid by</p>
          <div className={styles.field}>You</div>
        </div>
      </div>
      <p className={styles.fieldLabel}>Split evenly between 4 people</p>
      <ul className={styles.shares}>
        {people.map((name, i) => (
          <li key={name} className={styles.share} style={delayStyle(2200 + i * 300)}>
            <span className={styles.chipAvatar}>{name[0].toUpperCase()}</span>
            {name}
            <b>300 MAD</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SceneSettle({ run }: { run: boolean }) {
  return (
    <div className={styles.sceneBody}>
      <p className={styles.fieldLabel}>You owe</p>
      <div className={styles.settleRow}>
        <div className={styles.before}>
          <span className={styles.chipAvatar}>S</span>
          <span>salma</span>
          <b className={styles.settleAmount}>160 MAD</b>
          <span className={styles.rowBtn}>Settle up</span>
        </div>
        <div className={styles.after}>
          <span className={styles.paidCheck}><Check size={14} strokeWidth={2.5} aria-hidden /></span>
          <span>Paid salma</span>
          <b className={`${styles.settleAmount} ${styles.struck}`}>160 MAD</b>
        </div>
        <svg className={styles.cursor} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 3l14 8-6 2-2 6z" fill="var(--text)" stroke="var(--surface)" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={styles.plainRow}>
        <span className={styles.chipAvatar}>H</span>
        <span>hiba</span>
        <b className={styles.settleAmount}>45 MAD</b>
        <span className={styles.rowBtn}>Settle up</span>
      </div>
      <div className={styles.net}>
        <span>Net balance</span>
        <strong>
          <CountUp from={495} to={655} delay={2100} duration={900} run={run} /> MAD
        </strong>
      </div>
    </div>
  )
}

function HowDemo() {
  const reduced = usePrefersReducedMotion()
  const [bodyRef, inView] = useInView<HTMLDivElement>(0.35)
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [hover, setHover] = useState(false)
  const [userPaused, setUserPaused] = useState(false)

  useEffect(() => {
    if (inView) setStarted(true)
  }, [inView])

  const running = started && inView && !hover && !userPaused
  const next = () => setStep((s) => (s + 1) % STEPS.length)

  return (
    <section className={styles.howSection} aria-labelledby="how-it-works">
      <div className={styles.howHeader}>
        <h2 id="how-it-works" className={styles.howTitle}>From plans to paid, in three steps.</h2>
      </div>
      <div
        ref={bodyRef}
        className={styles.howBody}
        data-running={running}
        style={{ '--step-ms': `${STEP_MS}ms` } as CSSProperties}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={() => setHover(false)}
      >
        <ol className={styles.stepList}>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={styles.stepBtn}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => setStep(i)}
              >
                <span className={styles.stepNumber}>{i + 1}</span>
                <span className={styles.stepText}>
                  <strong className={styles.stepTitle}>{s.title}</strong>
                  <span className={styles.stepDesc}>{s.text}</span>
                </span>
                {i === step && (
                  <span className={styles.progress} aria-hidden="true">
                    <span className={styles.progressFill} onAnimationEnd={next} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>

        <div className={styles.demo}>
          <div className={styles.demoBar}>
            <span className={styles.demoDots} aria-hidden="true"><span /><span /><span /></span>
            <span>{STEPS[step].windowTitle}</span>
            {!reduced && (
              <button
                type="button"
                className={styles.pauseBtn}
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? 'Play demo' : 'Pause demo'}
              >
                {userPaused ? <Play size={13} aria-hidden /> : <Pause size={13} aria-hidden />}
              </button>
            )}
          </div>
          <div className={styles.screen} aria-hidden="true">
            <div key={step} className={styles.sceneWrap}>
              {step === 0 && <SceneCreate run={started} />}
              {step === 1 && <SceneExpense run={started} />}
              {step === 2 && <SceneSettle run={started} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------- */
export function Landing() {
  const { dark, toggle } = useTheme()
  const [featuresRef, featuresLive] = useInView<HTMLDivElement>(0.25)
  const { status, retry } = useAuthStatus()
  const signedIn = status === 'authenticated'
  const signedOut = status === 'unauthenticated'

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
            {dark ? <Sun size={18} strokeWidth={1.75} aria-hidden /> : <Moon size={18} strokeWidth={1.75} aria-hidden />}
          </button>
          <div className={styles.authLinks}>
            {signedIn ? (
              <>
                <Link to="/dashboard" className={styles.linkButton}>
                  <Button variant="ghost" size="sm">Go to dashboard</Button>
                </Link>
                <Button type="button" variant="primary" size="sm" onClick={() => void logout('/')}>
                  Log out
                </Button>
              </>
            ) : signedOut ? (
              <>
                <Link to="/login" className={styles.linkButton}>
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/signup" className={styles.linkButton}>
                  <Button variant="primary" size="sm">Get started</Button>
                </Link>
              </>
            ) : status === 'checking' ? (
              <span role="status">Checking sign-in…</span>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={retry}>Retry sign-in check</Button>
            )}
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
              Good times shouldn’t come with <span>messy math.</span>
            </h1>
            <p className={styles.description}>
              Split the riad, the taxi and the dinner in dirhams. See who paid, who owes
              what, and settle up with the fewest payments.
            </p>
            <div className={styles.ctaGroup}>
              {signedIn ? (
                <Link to="/dashboard" className={styles.linkButton}>
                  <Button variant="primary" size="md" icon={<ArrowRight size={18} aria-hidden />} className={styles.primaryCta}>
                    Go to dashboard
                  </Button>
                </Link>
              ) : signedOut ? (
                <>
                  <Link to="/signup" className={styles.linkButton}>
                    <Button variant="primary" size="md" icon={<ArrowRight size={18} aria-hidden />} className={styles.primaryCta}>
                      Start splitting for free
                    </Button>
                  </Link>
                  <Link to="/login" className={styles.linkButton}>
                    <Button variant="secondary" size="md" className={styles.secondaryCta}>
                      Sign in
                    </Button>
                  </Link>
                </>
              ) : status === 'error' ? (
                <Button type="button" variant="secondary" size="md" onClick={retry}>Retry sign-in check</Button>
              ) : null}
            </div>
            <p className={styles.reassurance}>Free to use. No card needed.</p>
          </div>

          <div
            className={styles.scene}
            role="img"
            aria-label="A preview of the Chefchaouen trip: Hiba paid the riad deposit of 1,200 MAD and your share is 300 MAD"
          >
            <span className={`zellige-layer ${styles.sceneZellige}`} aria-hidden="true" />
            <div className={styles.sceneGlow} />
            <div className={`${styles.receipt} ${styles.receiptBack}`} aria-hidden="true">
              <span className={styles.receiptMark} />
              <span className={styles.receiptLine} />
              <span className={`${styles.receiptLine} ${styles.receiptLineShort}`} />
              <span className={styles.receiptTotal}><CountUp to={2470} delay={600} duration={1400} /> MAD</span>
            </div>
            <div className={`${styles.receipt} ${styles.receiptFront}`} aria-hidden="true">
              <div className={styles.receiptTop}>
                <span className={styles.receiptIcon}><Split size={17} aria-hidden /></span>
                <span>Chefchaouen trip</span>
                <span className={styles.receiptPeople}>4 people</span>
              </div>
              <div className={styles.dinnerTitle}>Riad deposit.<br />Everyone in.</div>
              <div className={styles.expenseRow} style={delayStyle(700)}>
                <span className={styles.avatar}>H</span>
                <span className={styles.expenseName}>Hiba paid</span>
                <span className={styles.expenseAmount}>1,200 MAD</span>
              </div>
              <div className={styles.expenseRow} style={delayStyle(1000)}>
                <span className={`${styles.avatar} ${styles.avatarRust}`}>Y</span>
                <span className={styles.expenseName}>Your share</span>
                <span className={`${styles.expenseAmount} ${styles.expenseOwed}`}>300 MAD</span>
              </div>
              <div className={styles.receiptBottom}>
                <span>Your balance</span>
                <strong><ArrowDownLeft size={15} aria-hidden /> <CountUp to={300} delay={1500} duration={900} /> MAD</strong>
              </div>
            </div>
            <div className={styles.settledSlip} aria-hidden="true">
              <span className={styles.settledCheck}><Check size={13} strokeWidth={2.5} aria-hidden /></span>
              <span><strong>All square</strong><small>Friday football</small></span>
              <ArrowUpRight size={16} aria-hidden />
            </div>
          </div>
        </section>

        <section className={styles.useCases} aria-labelledby="use-cases-heading">
          <h2 id="use-cases-heading" className={styles.useCasesLabel}>Made for every shared tab</h2>
          <ul className={styles.useCaseList}>
            {USE_CASES.map(({ icon: Icon, tint, title, text, math, each }, i) => (
              <li key={title} className={styles.useCase} style={delayStyle(i * 70)}>
                <span className={`${styles.useCaseIcon} tint`} data-tint={tint} aria-hidden="true">
                  <Icon size={19} strokeWidth={1.8} aria-hidden />
                </span>
                <strong>{title}</strong>
                <p>{text}</p>
                <span className={styles.useCaseMath}>
                  <span>{math}</span>
                  <b>{each}</b>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.featuresSection} aria-labelledby="features-heading">
          <div className={styles.sectionHeader}>
            <h2 id="features-heading" className={styles.sectionTitle}>Less keeping score. More being there.</h2>
            <p className={styles.sectionSubtitle}>Everything the group needs to stay even, in one place.</p>
          </div>
          <div ref={featuresRef} className={styles.featuresGrid} data-live={featuresLive}>
            <article className={styles.featureCard}>
              <div className={styles.featureVisual} aria-hidden="true">
                <div className={styles.flow}>
                  <span className={styles.flowBefore}>5 payments</span>
                  <ArrowRight size={16} className={styles.flowArrow} aria-hidden />
                  <span className={styles.flowAfter}>2 payments</span>
                </div>
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureHead}>
                  <span className={styles.featureIcon}><Waypoints size={20} strokeWidth={1.8} aria-hidden /></span>
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
                  <span className={`${styles.bubble} ${styles.msgA}`}>Who has the taxi money?</span>
                  <span className={`${styles.slot} ${styles.slotRight}`}>
                    <span className={styles.typing}><span /><span /><span /></span>
                    <span className={`${styles.bubble} ${styles.bubbleMine} ${styles.msgB}`}>Yassine paid 450 MAD</span>
                  </span>
                </div>
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureHead}>
                  <span className={styles.featureIcon}><MessagesSquare size={20} strokeWidth={1.8} aria-hidden /></span>
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
                  <span className={`${styles.bubble} ${styles.bubbleMine} ${styles.msgA}`}>How much did we spend in total?</span>
                  <span className={styles.slot}>
                    <span className={styles.typing}><span /><span /><span /></span>
                    <span className={`${styles.bubble} ${styles.msgB}`}>2,470 MAD across 4 expenses.</span>
                  </span>
                </div>
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureHead}>
                  <span className={styles.featureIcon}><Bot size={20} strokeWidth={1.8} aria-hidden /></span>
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
                  <div className={styles.splitPills}>
                    <span className={`${styles.splitOpt} ${styles.splitEven}`}>Even</span>
                    <span className={`${styles.splitOpt} ${styles.splitCustom}`}>Custom</span>
                  </div>
                  <div className={styles.splitAmounts}>
                    <span className={styles.amtEven}>4 × 75 MAD</span>
                    <span className={styles.amtCustom}>120 / 90 / 60 / 30 MAD</span>
                  </div>
                </div>
              </div>
              <div className={styles.featureText}>
                <div className={styles.featureHead}>
                  <span className={styles.featureIcon}><Split size={20} strokeWidth={1.8} aria-hidden /></span>
                  <h3 className={styles.featureName}>Split it your way</h3>
                </div>
                <p className={styles.featureDesc}>
                  Share evenly, or set exact amounts for rent, groceries and everything in between.
                </p>
              </div>
            </article>
          </div>
        </section>

        <HowDemo />

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
          <span className="zellige-layer" aria-hidden="true" />
          <div>
            <h2 id="cta-heading" className={styles.ctaTitle}>Make the next split the easy one.</h2>
            <p className={styles.ctaSub}>Create your first group in under a minute.</p>
          </div>
          {signedIn ? (
            <Link to="/dashboard" className={styles.linkButton}>
              <Button variant="secondary" size="md" icon={<ArrowRight size={18} aria-hidden />} className={styles.ctaButton}>
                Go to dashboard
              </Button>
            </Link>
          ) : signedOut ? (
            <Link to="/signup" className={styles.linkButton}>
              <Button variant="secondary" size="md" icon={<ArrowRight size={18} aria-hidden />} className={styles.ctaButton}>
                Get started for free
              </Button>
            </Link>
          ) : null}
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

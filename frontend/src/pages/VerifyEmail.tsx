import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck, Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Sidebar'
import styles from './Login.module.css'
import pageStyles from './VerifyEmail.module.css'

type Status = 'pending' | 'verifying' | 'verified' | 'failed'

async function readMessage(response: Response): Promise<string | undefined> {
  try {
    const data = await response.json()
    return typeof data?.message === 'string' ? data.message : undefined
  } catch {
    return undefined
  }
}

function ResendForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setNotice(null)
    setError(null)
    try {
      const response = await fetch('/api/verify/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const message = await readMessage(response)
      if (response.ok) setNotice(message ?? 'A new link is on its way.')
      else setError(message ?? `Could not send the email (${response.status}).`)
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.errorAlert} role="alert">{error}</div>}
      {notice && <div className={pageStyles.notice} role="status">{notice}</div>}

      <div className={styles.field}>
        <label htmlFor="resend-email">Email</label>
        <input
          type="email"
          id="resend-email"
          name="email"
          autoComplete="email"
          spellCheck={false}
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alex@example.com…"
          required
        />
      </div>

      <Button
        type="submit"
        variant="secondary"
        disabled={sending}
        aria-busy={sending}
        className={styles.submitBtn}
      >
        {sending ? 'Sending…' : 'Resend verification email'}
      </Button>
    </form>
  )
}

export function VerifyEmail() {
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation()
  const token = params.get('token')
  const email = (location.state as { email?: string } | null)?.email ?? ''

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'pending')
  const [error, setError] = useState<string | null>(null)
  // The token is single-use, so StrictMode's second effect run must not send it again.
  const submitted = useRef(false)

  useEffect(() => {
    if (!token || submitted.current) return
    submitted.current = true

    fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          setError(await readMessage(response) ?? 'This verification link is invalid or has expired.')
          setStatus('failed')
          return
        }
        const data = await response.json()
        if (data.signedIn) navigate('/dashboard', { replace: true })
        else setStatus('verified')
      })
      .catch(() => {
        setError('Could not reach the server. Please try again.')
        setStatus('failed')
      })
  }, [token, navigate])

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
          {dark ? <Sun size={18} strokeWidth={1.75} aria-hidden /> : <Moon size={18} strokeWidth={1.75} aria-hidden />}
        </button>
      </header>

      <main className={styles.content}>
        <div className={styles.card}>
          {status === 'verifying' && (
            <div className={styles.header} role="status">
              <h1 className={styles.title}>Verifying your email…</h1>
              <p className={styles.subtitle}>This only takes a moment.</p>
            </div>
          )}

          {status === 'verified' && (
            <>
              <div className={styles.header}>
                <span className={pageStyles.icon} aria-hidden="true"><MailCheck size={20} /></span>
                <h1 className={styles.title}>Email verified</h1>
                <p className={styles.subtitle}>Your account is ready. Sign in to continue.</p>
              </div>
              <Link to="/login" className={styles.link}>Go to sign in</Link>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className={styles.header}>
                <span className={pageStyles.icon} aria-hidden="true"><MailCheck size={20} /></span>
                <h1 className={styles.title}>Check your inbox</h1>
                <p className={styles.subtitle}>
                  We sent a verification link to {email ? <strong>{email}</strong> : 'your email address'}.
                  Click it to finish setting up your account. The link expires in 24 hours.
                </p>
              </div>
              <p className={pageStyles.hint}>Didn’t get it? Check your spam folder, or send a new one.</p>
              <ResendForm initialEmail={email} />
            </>
          )}

          {status === 'failed' && (
            <>
              <div className={styles.header}>
                <h1 className={styles.title}>Link not valid</h1>
                <p className={styles.subtitle}>{error}</p>
              </div>
              <p className={pageStyles.hint}>Enter your email and we’ll send you a new link.</p>
              <ResendForm initialEmail={email} />
            </>
          )}

          {status !== 'verifying' && (
            <p className={styles.footer}>
              Already verified?{' '}
              <Link to="/login" className={styles.link}>Sign in</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

export default VerifyEmail

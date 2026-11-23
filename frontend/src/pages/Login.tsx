import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { Button } from '../components/ui/Button'
import { GoogleButton, OrDivider } from '../components/auth/GoogleButton'
import { TwoFactorStep } from '../components/auth/TwoFactorStep'
import { Logo } from '../components/layout/Sidebar'
import styles from './Login.module.css'

export function Login() {
  const { dark, toggle } = useTheme()
  const [params] = useSearchParams()
  const [handler, setHandler] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(params.get('error') === 'google' ? 'Google sign-in did not complete. Please try again.' : null)
  const [loading, setLoading] = useState(false)
  // Set when the first factor passed and the account wants an authenticator code.
  const [challenge, setChallenge] = useState<'password' | 'google' | null>(null)
  const navigate = useNavigate()

  // Google sign-in lands here with ?step=2fa when the account has 2FA on.
  useEffect(() => {
    if (params.get('step') !== '2fa') return
    let cancelled = false
    fetch('/auth/login/2fa')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.pending) setChallenge(data.method === 'google' ? 'google' : 'password')
        else setError('Your sign-in expired. Please sign in again.')
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: handler, password }),
      })
      const rawResponse = await response.text()
let data: { message?: string; requires2fa?: boolean } = {}

try {
  data = rawResponse ? JSON.parse(rawResponse) : {}
} catch {
  // Display plain-text server errors, but never display an HTML error page.
  if (rawResponse && !rawResponse.trim().startsWith('<')) {
    data.message = rawResponse
  }
}

if (!response.ok) {
  const fallbackMessage =
    response.status === 429
      ? 'Too many login attempts. Please wait 15 minutes and try again.'
      : `Login failed (${response.status}). Please try again.`

  setError(data.message || fallbackMessage)
} else if (data.requires2fa) {
  setPassword('')
  setChallenge('password')
} else {
  navigate('/dashboard')
}
    } catch (err) {
      console.error('Login error:', err)
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`)
      } else {
        setError('An unexpected error occurred while logging in.')
      }
    } finally {
      setLoading(false)
    }
  }

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
        <div className={styles.card}>
          {challenge ? (
            <TwoFactorStep
              key={challenge}
              method={challenge}
              onSuccess={() => navigate('/dashboard', { replace: true })}
              onRestart={(message) => {
                setChallenge(null)
                setError(message ?? null)
              }}
            />
          ) : (
          <>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Enter your details to sign in to your account</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.errorAlert}>{error}</div>}

            <div className={styles.field}>
              <label htmlFor="handler">Username or Email</label>
              <input
                type="text"
                id="handler"
                name="handler"
                className={styles.input}
                value={handler}
                onChange={(e) => setHandler(e.target.value)}
                placeholder="alex or alex@example.com"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <OrDivider />
          <GoogleButton />

          <p className={styles.footer}>
            Don't have an account?{' '}
            <Link to="/signup" className={styles.link}>
              Sign up
            </Link>
          </p>
          </>
          )}
        </div>
      </main>
    </div>
  )
}

export default Login

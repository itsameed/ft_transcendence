import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Sidebar'
import styles from './Login.module.css'

export function Login() {
  const { dark, toggle } = useTheme()
  const [handler, setHandler] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Login failed')
      } else {
        console.log('Login successful:', data)
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

          <p className={styles.footer}>
            Don't have an account?{' '}
            <Link to="/signup" className={styles.link}>
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login

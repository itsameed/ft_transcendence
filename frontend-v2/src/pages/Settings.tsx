import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Moon, Sun } from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { logout } from '../lib/auth'
import { useTheme } from '../lib/useTheme'
import type { User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './Settings.module.css'

export function SettingsPage() {
  const [me, setMe] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const { dark, toggle } = useTheme()

  async function signOut() {
    setLoggingOut(true)
    await logout()
  }
  const navigate = useNavigate()

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPwMessage('')
    setPwError('')
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setPwError('New password and confirmation do not match.'); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (res.status === 401) { navigate('/login'); return }
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not update your password.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setPwMessage('Password updated.')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not update your password.')
    } finally {
      setPwSaving(false)
    }
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/my-profile')
        if (response.status === 401) { navigate('/login'); return }
        if (!response.ok) throw new Error('Could not load account details.')
        const data = await response.json()
        setMe(data.user)
      } catch {
        setMe(null)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [navigate])

  if (loading) return <div className={styles.state}>Loading settings...</div>
  if (!me) return <div className={styles.state} role="alert">Account settings are unavailable.</div>

  return (
    <div className={pageStyles.app}>
      <Sidebar me={me} />
      <main className={pageStyles.main}>
        <div className={styles.content}>
          <header className={styles.heading}>
            <p className={styles.eyebrow}>Preferences</p>
            <h1>Settings</h1>
            <p>Make Tally feel right for you.</p>
          </header>

          <section className={styles.section} aria-labelledby="appearance-heading">
            <div className={styles.sectionHeading}>
              <h2 id="appearance-heading">Appearance</h2>
              <p>Choose the color theme used across Tally.</p>
            </div>
            <Card className={styles.preference}>
              <div className={styles.preferenceCopy}>
                <strong>Theme</strong>
                <span>Your choice is saved on this device.</span>
              </div>
              <div className={styles.segment} role="group" aria-label="Color theme">
                <button type="button" aria-pressed={!dark} className={!dark ? styles.selected : ''} onClick={() => dark && toggle()}>
                  <Sun size={16} aria-hidden />
                  Light
                </button>
                <button type="button" aria-pressed={dark} className={dark ? styles.selected : ''} onClick={() => !dark && toggle()}>
                  <Moon size={16} aria-hidden />
                  Dark
                </button>
              </div>
            </Card>
          </section>

          <section className={styles.section} aria-labelledby="account-heading">
            <div className={styles.sectionHeading}>
              <h2 id="account-heading">Account</h2>
              <p>Manage the details people see when you share expenses.</p>
            </div>
            <Card className={styles.account}>
              <div className={styles.accountIdentity}>
                <Avatar user={me} size={42} />
                <div>
                  <strong>{me.name}</strong>
                  <span>{me.email}</span>
                </div>
              </div>
              <Link to="/profile" className={styles.editLink}>Edit profile</Link>
            </Card>
          </section>

          <section className={styles.section} aria-labelledby="security-heading">
            <div className={styles.sectionHeading}>
              <h2 id="security-heading">Password</h2>
              <p>Change the password you use to sign in to Tally.</p>
            </div>
            <Card>
              <form className={styles.pwForm} onSubmit={changePassword}>
                <label>
                  <span>Current password</span>
                  <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required autoComplete="current-password" />
                </label>
                <label>
                  <span>New password</span>
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} autoComplete="new-password" />
                </label>
                <label>
                  <span>Confirm new password</span>
                  <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required autoComplete="new-password" />
                </label>
                <div className={styles.pwFooter}>
                  <span className={pwError ? styles.pwError : styles.pwMessage} role={pwError ? 'alert' : 'status'}>{pwError || pwMessage}</span>
                  <Button type="submit" variant="primary" disabled={pwSaving}>{pwSaving ? 'Updating…' : 'Update password'}</Button>
                </div>
              </form>
            </Card>
          </section>

          <section className={styles.section} aria-labelledby="session-heading">
            <div className={styles.sectionHeading}>
              <h2 id="session-heading">Session</h2>
              <p>Sign out of Tally on this device.</p>
            </div>
            <Card className={styles.preference}>
              <div className={styles.preferenceCopy}>
                <strong>{me.name}</strong>
                <span>{me.email}</span>
              </div>
              <Button type="button" icon={<LogOut size={15} />} onClick={signOut} disabled={loggingOut} className={styles.signOut}>
                {loggingOut ? 'Logging out…' : 'Log out'}
              </Button>
            </Card>
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
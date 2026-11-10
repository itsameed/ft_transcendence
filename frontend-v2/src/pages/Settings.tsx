import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import { useTheme } from '../lib/useTheme'
import type { User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './Settings.module.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function SettingsPage() {
  const [me, setMe] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

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
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
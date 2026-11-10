import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import type { User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './Profile.module.css'

interface Profile extends User {
  joinedAt: string
  totalExpenses: number
  friendsCount: number
  numberOfGroups: number
  numberOfExpenses: number
}

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/my-profile')
        if (response.status === 401) { navigate('/login'); return }
        if (!response.ok) throw new Error('Could not load your profile.')
        const data = await response.json()
        const user: Profile = data.user
        setProfile(user)
        setUsername(user.name)
        setEmail(user.email)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load your profile.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [navigate])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/profile/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      })
      if (response.status === 401) { navigate('/login'); return }
      if (!response.ok) throw new Error('Could not save your profile.')
      const updated = await response.json()
      setProfile((current) => current ? { ...current, name: updated.username, email: updated.email } : current)
      setUsername(updated.username)
      setEmail(updated.email)
      setMessage('Profile updated.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.state}>Loading profile...</div>
  if (!profile) return <div className={styles.state} role="alert">{error || 'Profile unavailable.'}</div>

  return (
    <div className={pageStyles.app}>
      <Sidebar me={profile} />
      <main className={pageStyles.main}>
        <div className={styles.content}>
          <header className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>Account</p>
              <h1>Your profile</h1>
              <p className={styles.intro}>Your details and activity on Tally.</p>
            </div>
          </header>

          <Card className={styles.identity}>
            <Avatar user={profile} size={64} />
            <div className={styles.identityText}>
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
              <span>Member since {profile.joinedAt}</span>
            </div>
          </Card>

          <section className={styles.stats} aria-label="Your activity">
            <Card className={styles.stat}><span>Groups</span><strong>{profile.numberOfGroups}</strong></Card>
            <Card className={styles.stat}><span>Friends</span><strong>{profile.friendsCount}</strong></Card>
            <Card className={styles.stat}><span>Expenses</span><strong>{profile.numberOfExpenses}</strong></Card>
            <Card className={styles.stat}><span>Total tracked</span><strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(profile.totalExpenses)}</strong></Card>
          </section>

          <section className={styles.section} aria-labelledby="profile-details">
            <div className={styles.sectionHeading}>
              <h2 id="profile-details">Personal details</h2>
              <p>Update the name and email address associated with your account.</p>
            </div>
            <Card>
              <form className={styles.form} onSubmit={saveProfile}>
                <label>
                  <span>Username</span>
                  <input value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={40} autoComplete="username" />
                </label>
                <label>
                  <span>Email address</span>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
                </label>
                <div className={styles.formFooter}>
                  <span className={error ? styles.error : styles.message} role={error ? 'alert' : 'status'}>{error || message}</span>
                  <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
                </div>
              </form>
            </Card>
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { AvatarPicker } from '../components/ui/AvatarPicker'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { money } from '../lib/format'
import { isDefaultAvatar } from '../lib/avatars'
import { formatBytes, isAbortError, uploadWithProgress, type UploadProgress } from '../lib/upload'
import type { User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './Profile.module.css'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // matches the backend multer limit
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

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
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const uploadAbort = useRef<AbortController | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!avatarPreview) return
    return () => URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  // Don't leave an upload running after leaving the page.
  useEffect(() => () => uploadAbort.current?.abort(), [])

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
        setAvatarId(isDefaultAvatar(user.avatar) ? user.avatar!.replace('/avatars/', '').replace('.svg', '') : null)
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

  function pickPhoto(file: File) {
    setAvatarMessage('')
    if (!PHOTO_TYPES.includes(file.type)) {
      setAvatarError('That file isn’t a supported image. Use a JPG, PNG, WebP or GIF.')
      return
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setAvatarError(`That photo is ${formatBytes(file.size)}. Please choose one under 5 MB.`)
      return
    }
    setAvatarError('')
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarFile(file)
  }

  function clearPhoto() {
    setAvatarPreview(null)
    setAvatarFile(null)
  }

  async function saveAvatar() {
    setAvatarSaving(true)
    setAvatarMessage('')
    setAvatarError('')
    try {
      const body = new FormData()
      if (avatarFile) body.append('avatar', avatarFile)
      else if (avatarId) body.append('avatar', avatarId)
      else throw new Error('Choose an avatar or upload a photo.')

      const controller = new AbortController()
      uploadAbort.current = controller
      if (avatarFile) setUploadProgress({ loaded: 0, total: avatarFile.size, percent: 0, processing: false })

      const response = await uploadWithProgress<{ avatar: string; message?: string }>('/api/profile/avatar', body, {
        signal: controller.signal,
        onProgress: avatarFile ? setUploadProgress : undefined,
      })
      if (response.status === 401) { navigate('/login'); return }
      const data = response.data
      if (!response.ok || !data) throw new Error(data?.message ?? 'Could not save your avatar.')

      setProfile((current) => current ? { ...current, avatar: data.avatar } : current)
      setAvatarId(isDefaultAvatar(data.avatar) ? data.avatar.replace('/avatars/', '').replace('.svg', '') : null)
      clearPhoto()
      setAvatarMessage('Avatar updated.')
    } catch (saveError) {
      if (isAbortError(saveError)) setAvatarMessage('Upload cancelled.')
      else setAvatarError(saveError instanceof Error ? saveError.message : 'Could not save your avatar.')
    } finally {
      uploadAbort.current = null
      setUploadProgress(null)
      setAvatarSaving(false)
    }
  }

  if (loading) return <div className={styles.state} role="status">Loading profile…</div>
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
              <p className={styles.intro}>Your details and activity on Splitify.</p>
            </div>
          </header>

          <Card className={styles.identity}>
            <Avatar user={{ ...profile, avatar: avatarPreview ?? profile.avatar }} size={64} />
            <div className={styles.identityText}>
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
              <span>Member since {profile.joinedAt}</span>
            </div>
          </Card>

          <section className={styles.section} aria-labelledby="profile-avatar">
            <div className={styles.sectionHeading}>
              <h2 id="profile-avatar">Profile photo</h2>
              <p>Upload a photo of your own, or pick one of the defaults.</p>
            </div>
            <Card>
              <div className={styles.avatarForm}>
                <AvatarPicker
                  value={avatarId}
                  onChange={(id) => { setAvatarId(id); clearPhoto(); setAvatarMessage(''); setAvatarError('') }}
                  preview={avatarPreview}
                  onFile={pickPhoto}
                  onClearPhoto={clearPhoto}
                  fileInfo={avatarFile ? { name: avatarFile.name, size: avatarFile.size } : null}
                  progress={uploadProgress}
                  onCancelUpload={() => uploadAbort.current?.abort()}
                  disabled={avatarSaving}
                />
                <div className={styles.formFooter}>
                  <span className={avatarError ? styles.error : styles.message} role={avatarError ? 'alert' : 'status'}>{avatarError || avatarMessage}</span>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={saveAvatar}
                    disabled={avatarSaving || (!avatarFile && !avatarId)}
                  >
                    {avatarSaving ? (uploadProgress ? 'Uploading…' : 'Saving…') : 'Save photo'}
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          <section className={styles.stats} aria-label="Your activity">
            <Card className={styles.stat}><span>Groups</span><strong>{profile.numberOfGroups}</strong></Card>
            <Card className={styles.stat}><span>Friends</span><strong>{profile.friendsCount}</strong></Card>
            <Card className={styles.stat}><span>Expenses</span><strong>{profile.numberOfExpenses}</strong></Card>
            <Card className={styles.stat}><span>Total tracked</span><strong>{money(profile.totalExpenses)}</strong></Card>
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
                  <input name="username" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={40} autoComplete="username" autoCapitalize="none" spellCheck={false} />
                </label>
                <label>
                  <span>Email address</span>
                  <input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" spellCheck={false} />
                </label>
                <div className={styles.formFooter}>
                  <span className={error ? styles.error : styles.message} role={error ? 'alert' : 'status'}>{error || message}</span>
                  <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
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
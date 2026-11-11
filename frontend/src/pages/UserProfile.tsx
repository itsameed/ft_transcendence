import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, UserMinus, UserPlus } from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { iconForKind } from '../lib/GroupKinds'
import type { User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './Profile.module.css'

interface PublicGroup { id: string; name: string; kind: string; createdAt: string }
interface PublicUser {
  id: string; name: string; username: string; email: string; joinedAt: string
  isSelf: boolean; relationship: 'self' | 'friends' | 'request-sent' | 'request-received' | 'none'
}

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const [me, setMe] = useState<User | null>(null)
  const [person, setPerson] = useState<PublicUser | null>(null)
  const [groups, setGroups] = useState<PublicGroup[]>([])
  const [groupsLabel, setGroupsLabel] = useState('Groups you share')
  const [relation, setRelation] = useState<PublicUser['relationship']>('none')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, personRes] = await Promise.all([
          fetch('/api/my-profile'), fetch(`/api/users/${userId}/profile`),
        ])
        if (profileRes.status === 401 || personRes.status === 401) { navigate('/login'); return }
        if (personRes.status === 404) { setError('This person could not be found.'); return }
        if (!personRes.ok) throw new Error('Could not load this profile.')
        const profile = profileRes.ok ? await profileRes.json() : null
        if (profile?.user) setMe(profile.user)
        const data = await personRes.json()
        setPerson(data.user)
        setGroups(data.groups ?? [])
        setGroupsLabel(data.groupsLabel ?? 'Groups you share')
        setRelation(data.user.relationship)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load this profile.')
      }
    }
    load()
  }, [userId, navigate])

  async function act(url: string, init: RequestInit, next: PublicUser['relationship']) {
    const res = await fetch(url, init)
    if (res.ok) setRelation(next)
  }

  if (error) {
    return (
      <div className={styles.state} role="alert">
        <p>{error}</p>
        <Link to="/groups">Back to Groups &amp; Friends</Link>
      </div>
    )
  }
  if (!me || !person) return <div className={styles.state}>Loading profile…</div>

  const self: User = { id: person.id, name: person.name, email: person.email }

  return (
    <div className={pageStyles.app}>
      <Sidebar me={me} />
      <main className={pageStyles.main}>
        <div className={styles.content}>
          <Link to="/groups" className={styles.backLink}><ArrowLeft size={16} aria-hidden /> Groups &amp; Friends</Link>

          <Card className={styles.identity}>
            <Avatar user={self} size={64} />
            <div className={styles.identityText}>
              <h2>{person.name}</h2>
              <p>{person.email}</p>
              <span>Member since {person.joinedAt}</span>
            </div>
            {!person.isSelf && (
              <span className={styles.identityActions}>
                {relation === 'friends' && (
                  <>
                    <Link to="/chat" className={styles.inlineAction}><MessageSquare size={15} aria-hidden /> Chat</Link>
                    <button type="button" className={styles.removeBtn} onClick={() => act('/api/friends', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendId: person.id }) }, 'none')}>
                      <UserMinus size={15} aria-hidden /> Remove
                    </button>
                  </>
                )}
                {relation === 'none' && (
                  <Button variant="primary" size="sm" icon={<UserPlus size={15} />} onClick={() => act('/api/friends/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: person.id }) }, 'request-sent')}>Add friend</Button>
                )}
                {relation === 'request-sent' && <span className={styles.badge}>Request sent</span>}
                {relation === 'request-received' && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => act(`/api/friends/request/${person.id}/accept`, { method: 'PATCH' }, 'friends')}>Accept request</Button>
                    <button type="button" className={styles.removeBtn} onClick={() => act(`/api/friends/request/${person.id}/reject`, { method: 'PATCH' }, 'none')}>Decline</button>
                  </>
                )}
              </span>
            )}
            {person.isSelf && <Link to="/profile" className={styles.inlineAction}>Edit your profile</Link>}
          </Card>

          <section className={styles.section} aria-labelledby="shared-groups">
            <div className={styles.sectionHeading}>
              <h2 id="shared-groups">{groupsLabel} ({groups.length})</h2>
              <p>{person.isSelf ? 'Every group you belong to.' : `Groups you and ${person.name.split(' ')[0]} are both in.`}</p>
            </div>
            {groups.length === 0 ? (
              <p className={styles.intro}>No shared groups yet.</p>
            ) : (
              <ul className={styles.groupList}>
                {groups.map((g) => {
                  const Icon = iconForKind(g.kind)
                  return (
                    <li key={g.id}>
                      <Link to={`/groups/${g.id}`} className={styles.groupRow}>
                        <span className={styles.groupIcon}><Icon size={20} strokeWidth={1.5} aria-hidden /></span>
                        <span className={styles.groupName}>{g.name}</span>
                        <span className={styles.groupMeta}>{new Date(g.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

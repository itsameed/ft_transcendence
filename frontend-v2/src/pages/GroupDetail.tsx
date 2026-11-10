import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Crown, MessageSquare } from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import { iconForKind } from '../lib/GroupKinds'
import type { User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './Profile.module.css'

interface GroupMember { user: User; role: string; joinedAt: string }
interface GroupDetail {
  id: string; name: string; kind: string; description: string
  createdBy: User; createdAt: string; conversationId?: string; members: GroupMember[]
}

function mapUser(raw: any): User {
  return { id: String(raw?._id ?? raw?.id ?? ''), name: raw?.username ?? raw?.name ?? 'Unknown', email: raw?.email ?? '' }
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [me, setMe] = useState<User | null>(null)
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, groupRes] = await Promise.all([
          fetch('/api/my-profile'), fetch(`/api/groups/${groupId}`),
        ])
        if (profileRes.status === 401 || groupRes.status === 401) { navigate('/login'); return }
        if (groupRes.status === 404) { setError('This group could not be found.'); return }
        if (groupRes.status === 403) { setError('You are not a member of this group.'); return }
        if (!groupRes.ok) throw new Error('Could not load this group.')
        const profile = profileRes.ok ? await profileRes.json() : null
        if (profile?.user) setMe(profile.user)
        const data = await groupRes.json()
        const g = data.group
        setGroup({
          id: String(g._id ?? g.id),
          name: g.name,
          kind: g.kind ?? 'other',
          description: g.description ?? '',
          createdBy: mapUser(g.createdBy),
          createdAt: g.createdAt,
          conversationId: g.conversationId ?? undefined,
          members: (g.members ?? []).map((m: any) => ({ user: mapUser(m.userId), role: m.role, joinedAt: m.joinedAt })),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load this group.')
      }
    }
    load()
  }, [groupId, navigate])

  if (error) {
    return (
      <div className={styles.state} role="alert">
        <p>{error}</p>
        <Link to="/groups">Back to Groups &amp; Friends</Link>
      </div>
    )
  }
  if (!me || !group) return <div className={styles.state}>Loading group…</div>

  const Icon = iconForKind(group.kind)
  const created = new Date(group.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className={pageStyles.app}>
      <Sidebar me={me} />
      <main className={pageStyles.main}>
        <div className={styles.content}>
          <Link to="/groups" className={styles.backLink}><ArrowLeft size={16} aria-hidden /> Groups &amp; Friends</Link>

          <header className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>Group</p>
              <h1>{group.name}</h1>
              <p className={styles.intro}>{group.description || 'No description yet.'}</p>
            </div>
          </header>

          <Card className={styles.identity}>
            <span className={styles.groupBadge}><Icon size={28} strokeWidth={1.5} aria-hidden /></span>
            <div className={styles.identityText}>
              <h2>{group.name}</h2>
              <p>Created by <Link to={`/users/${group.createdBy.id}`}>{group.createdBy.name}</Link></p>
              <span>Created {created} · {group.members.length} {group.members.length === 1 ? 'member' : 'members'}</span>
            </div>
            {group.conversationId && (
              <Link to={`/chat?group=${group.id}`} className={styles.inlineAction}><MessageSquare size={15} aria-hidden /> Open chat</Link>
            )}
          </Card>

          <section className={styles.section} aria-labelledby="group-members">
            <div className={styles.sectionHeading}>
              <h2 id="group-members">Members ({group.members.length})</h2>
              <p>Select a member to view their profile.</p>
            </div>
            <ul className={styles.groupList}>
              {group.members.map((m) => (
                <li key={m.user.id}>
                  <Link to={`/users/${m.user.id}`} className={styles.groupRow}>
                    <Avatar user={m.user} size={34} />
                    <span className={styles.groupName}>{m.user.name}{m.user.id === me.id ? ' (you)' : ''}</span>
                    {m.role === 'owner' && <span className={styles.badge}><Crown size={13} aria-hidden /> Owner</span>}
                    <span className={styles.groupMeta}>{m.user.email}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, UserPlus } from 'lucide-react'
import { GroupsGrid } from '../components/dashboard/GroupsGrid'
import { CreateGroupModal } from '../components/groups/CreateGroupModal'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Toast } from '../components/ui/Toast'
import type { Group, User } from '../types'
import dashStyles from './Dashboard.module.css'
import styles from './Group.module.css'

interface ApiMember { userId: { _id: string; username: string; email: string }; role: string }
interface ApiGroup { _id: string; name: string; kind: string; description?: string; conversationId?: string; createdAt: string; members: ApiMember[] }
interface FriendRequest { _id: string; requester: { _id: string; username: string; email: string } }
type Filter = 'all' | 'groups' | 'friends' | 'requests'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'groups', label: 'Groups' },
  { id: 'friends', label: 'Friends' }, { id: 'requests', label: 'Requests' },
]

export function GroupPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [people, setPeople] = useState<User[]>([])
  const [me, setMe] = useState<User | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const NOW = new Date()

  useEffect(() => {
    async function load() {
      try {
        const [groupsRes, profileRes, friendsRes, requestsRes] = await Promise.all([
          fetch('/api/groups/me'), fetch('/api/my-profile'), fetch('/api/friends'), fetch('/api/friends/requests'),
        ])
        if ([groupsRes, profileRes, friendsRes, requestsRes].some((r) => r.status === 401)) { navigate('/login'); return }
        if (!groupsRes.ok) throw new Error(`Failed to load groups (${groupsRes.status})`)
        const data = await groupsRes.json()
        const profile = profileRes.ok ? await profileRes.json() : null
        if (profile?.user) setMe(profile.user)
        setGroups((data.groups ?? []).map((g: ApiGroup) => ({
          id: g._id, name: g.name, emoji: '', kind: (g.kind || 'other') as Group['kind'],
          memberIds: (g.members ?? []).map((m) => m.userId._id), totalSpent: 0, yourBalance: 0,
          description: g.description ?? '', createdAt: g.createdAt, conversationId: g.conversationId,
        })))
        if (friendsRes.ok) {
          const d = await friendsRes.json()
          setFriends((d.friends ?? []).map((f: any) => ({ id: f._id, name: f.username, email: f.email })))
        }
        if (requestsRes.ok) {
          const d = await requestsRes.json()
          setRequests(d.requests ?? [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally { setLoading(false) }
    }
    load()
  }, [navigate])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setPeople([]); return }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/search?q=${encodeURIComponent(q)}`)
        if (!res.ok) return
        const data = await res.json()
        const friendIds = new Set(friends.map((f) => f.id))
        setPeople((Array.isArray(data) ? data : []).map((u: any) => ({ id: u._id, name: u.username, email: u.email ?? '' })).filter((u: User) => u.id && u.id !== me?.id && !friendIds.has(u.id)))
      } catch { /* search is best-effort */ }
    }, 250)
    return () => window.clearTimeout(t)
  }, [query, friends, me])

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? groups.filter((g) => g.name.toLowerCase().includes(q)) : groups
  }, [groups, query])
  const visibleFriends = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? friends.filter((f) => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)) : friends
  }, [friends, query])

  const showGroups = filter === 'all' || filter === 'groups'
  const showFriends = filter === 'all' || filter === 'friends'
  const showRequests = filter === 'all' || filter === 'requests'

  async function act(url: string, init: RequestInit, ok: string) {
    const res = await fetch(url, init)
    setToast(res.ok ? ok : 'Something went wrong — please try again')
    return res.ok
  }
  const removeFriend = async (f: User) => {
    if (await act('/api/friends', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendId: f.id }) }, `Removed ${f.name}`))
      setFriends((p) => p.filter((x) => x.id !== f.id))
  }
  const addFriend = async (u: User) => {
    if (await act('/api/friends/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: u.id }) }, `Friend request sent to ${u.name}`))
      setPeople((p) => p.filter((x) => x.id !== u.id))
  }
  const respond = async (r: FriendRequest, accept: boolean) => {
    if (await act(`/api/friends/request/${r._id}/${accept ? 'accept' : 'reject'}`, { method: 'PATCH' }, accept ? `You and ${r.requester.username} are now friends` : 'Request declined')) {
      setRequests((p) => p.filter((x) => x._id !== r._id))
      if (accept) setFriends((p) => [...p, { id: r.requester._id, name: r.requester.username, email: r.requester.email }])
    }
  }

  if (loading || !me) {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>{error ?? 'Loading…'}</div>
  }

  return (
    <div className={dashStyles.app}>
      <Sidebar me={me} />
      <main className={dashStyles.main}>
        <div className={dashStyles.content}>
          <header>
            <h1 className={styles.heading}>Groups &amp; Friends</h1>
            <p className={styles.sub}>Find people and groups, manage friends and requests.</p>
          </header>

          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search size={17} aria-hidden />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search friends, groups, or people to add…" aria-label="Search" />
            </label>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>New group</Button>
          </div>

          <div className={styles.chips} role="tablist" aria-label="Filter">
            {FILTERS.map((f) => (
              <button key={f.id} role="tab" aria-selected={filter === f.id} className={`${styles.chip} ${filter === f.id ? styles.chipOn : ''}`} onClick={() => setFilter(f.id)}>
                {f.label}{f.id === 'requests' && requests.length > 0 ? ` (${requests.length})` : ''}
              </button>
            ))}
          </div>

          {people.length > 0 && (
            <section aria-label="People">
              <h2 className={styles.sectionTitle}>People</h2>
              <ul className={styles.rows}>
                {people.map((u) => (
                  <li key={u.id} className={styles.row}>
                    <Link className={styles.rowLink} to={`/users/${u.id}`}>
                      <Avatar user={u} size={34} /><span className={styles.who}><strong>{u.name}</strong><small>{u.email || 'Not a friend yet'}</small></span>
                    </Link>
                    <span className={styles.actions}><Button variant="primary" size="sm" icon={<UserPlus size={15} />} onClick={() => addFriend(u)}>Add friend</Button></span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showRequests && requests.length > 0 && (
            <section aria-label="Friend requests">
              <h2 className={styles.sectionTitle}>Friend requests</h2>
              <ul className={styles.rows}>
                {requests.map((r) => (
                  <li key={r._id} className={styles.row}>
                    <Link className={styles.rowLink} to={`/users/${r.requester._id}`}>
                      <Avatar user={{ id: r.requester._id, name: r.requester.username, email: r.requester.email }} size={34} />
                      <span className={styles.who}><strong>{r.requester.username}</strong><small>sent you a friend request</small></span>
                    </Link>
                    <span className={styles.actions}>
                      <Button variant="primary" size="sm" onClick={() => respond(r, true)}>Accept</Button>
                      <Button size="sm" onClick={() => respond(r, false)}>Decline</Button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showGroups && (
            <section aria-label="Your groups">
              <h2 className={styles.sectionTitle}>Your groups ({visibleGroups.length})</h2>
              {visibleGroups.length === 0 ? <p className={styles.empty}>No groups match.</p> : <GroupsGrid groups={visibleGroups} now={NOW} />}
              <p className={styles.hint}>Select a group to see its members and details, or create a new group with your friends.</p>
            </section>
          )}

          {showFriends && (
            <section aria-label="Friends">
              <h2 className={styles.sectionTitle}>Friends ({visibleFriends.length})</h2>
              {visibleFriends.length === 0 ? <p className={styles.empty}>No friends match.</p> : (
                <ul className={styles.rows}>
                  {visibleFriends.map((f) => (
                    <li key={f.id} className={styles.row}>
                      <Link className={styles.rowLink} to={`/users/${f.id}`}>
                        <Avatar user={f} size={34} /><span className={styles.who}><strong>{f.name}</strong><small>{f.email}</small></span>
                      </Link>
                      <span className={styles.actions}>
                        <Link className={styles.chatLink} to="/chat">Chat</Link>
                        <button type="button" className={styles.remove} onClick={() => removeFriend(f)}>Remove</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>
      <MobileNav onAdd={() => setCreating(true)} />
      <CreateGroupModal
        open={creating}
        friends={friends}
        onClose={() => setCreating(false)}
        onCreated={(group) => {
          setGroups((prev) => [group, ...prev])
          setCreating(false)
          setToast(`Created “${group.name}”`)
          navigate(`/groups/${group.id}`)
        }}
      />
      <Toast message={toast} />
    </div>
  )
}

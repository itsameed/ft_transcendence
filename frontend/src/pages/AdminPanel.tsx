import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Button } from '../components/ui/Button'
import { Section } from '../components/ui/Section'
import type { User } from '../types'
import styles from './AdminPanel.module.css'

type AdminUser = {
  _id: string
  username: string
  displayName?: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'suspended'
  joinedAt?: string
}

type AdminGroup = {
  _id: string
  name: string
  createdBy?: { username?: string; email?: string }
  members?: Array<{ userId?: { _id?: string; username?: string; email?: string } }>
  createdAt?: string
}

type AdminStats = {
  users: { total: number; active: number; suspended: number; admins: number }
  groups: { total: number }
  expenses: { total: number }
}

const safeJson = async (response: Response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AdminPanelPage() {
  const navigate = useNavigate()
  const [me, setMe] = useState<User | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadAdminData() {
      try {
        const profileRes = await fetch('/api/my-profile', { headers: { Accept: 'application/json' } })
        if (profileRes.status === 401) {
          navigate('/login')
          return
        }

        const profileData = await safeJson(profileRes)
        const user = profileData?.user
        if (!user || user.role !== 'admin') {
          navigate('/dashboard')
          return
        }

        const [statsRes, usersRes, groupsRes] = await Promise.all([
          fetch('/api/admin/statistics'),
          fetch('/api/admin/users'),
          fetch('/api/admin/groups'),
        ])

        if (!ignore) {
          setMe({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            avatar: user.avatar ?? null,
          })
          setStats(statsRes.ok ? (await safeJson(statsRes) as AdminStats) : null)
          setUsers(usersRes.ok ? ((await safeJson(usersRes))?.users ?? []) : [])
          setGroups(groupsRes.ok ? ((await safeJson(groupsRes))?.groups ?? []) : [])
        }
      } catch (error) {
        console.error('Failed to load admin panel', error)
        if (!ignore) navigate('/dashboard')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void loadAdminData()
    return () => { ignore = true }
  }, [navigate])

  const totalUsers = useMemo(() => stats?.users.total ?? users.length, [stats, users.length])

  const handleStatusChange = async (userId: string, targetStatus: 'active' | 'suspended') => {
    setBusyId(userId)
    try {
      const previousStatus = users.find((user) => user._id === userId)?.status ?? targetStatus
      const action = targetStatus === 'suspended' ? 'suspend' : 'reactivate'
      const response = await fetch(`/api/admin/users/${userId}/${action}`, { method: 'PATCH' })
      if (!response.ok) {
        const payload = await safeJson(response)
        throw new Error(payload?.message ?? 'Action failed')
      }
      const payload = await safeJson(response)
      const nextStatus = payload?.user?.status ?? targetStatus
      setUsers((current) => current.map((user) => user._id === userId ? { ...user, status: nextStatus } : user))
      setStats((current) => {
        if (!current) return current
        const activeDelta = (previousStatus === 'active' && nextStatus !== 'active' ? -1 : 0) + (previousStatus !== 'active' && nextStatus === 'active' ? 1 : 0)
        const suspendedDelta = (previousStatus === 'suspended' && nextStatus !== 'suspended' ? -1 : 0) + (previousStatus !== 'suspended' && nextStatus === 'suspended' ? 1 : 0)

        return {
          ...current,
          users: {
            ...current.users,
            active: current.users.active + activeDelta,
            suspended: current.users.suspended + suspendedDelta,
            total: current.users.total,
          },
        }
      })
    } catch (error) {
      console.error('Status update failed', error)
      window.alert(error instanceof Error ? error.message : 'Status update failed')
    } finally {
      setBusyId(null)
    }
  }

  if (!me || loading) {
    return <div className="page-state" role="status">Loading admin panel…</div>
  }

  return (
    <div className={styles.app}>
      <Sidebar me={me} />

      <main className={styles.main}>
        <div className={styles.content}>
          <header className={styles.headerRow}>
            <div>
              <p className={styles.eyebrow}>Operations</p>
              <h1>Admin panel</h1>
            </div>
          </header>

          <Section title="Overview">
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span>Total users</span>
                <strong>{totalUsers}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Active</span>
                <strong>{stats?.users.active ?? users.filter((user) => user.status === 'active').length}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Suspended</span>
                <strong>{stats?.users.suspended ?? users.filter((user) => user.status === 'suspended').length}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Groups</span>
                <strong>{stats?.groups.total ?? groups.length}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Expenses</span>
                <strong>{stats?.expenses.total ?? 0}</strong>
              </div>
            </div>
          </Section>

          <div className={styles.columns}>
            <Section title="Users">
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isCurrentAdmin = user._id === me.id
                      const isLocked = user.role === 'admin' || isCurrentAdmin

                      return (
                        <tr key={user._id}>
                          <td>
                            <div className={styles.userCell}>
                              <strong>{user.displayName ?? user.username}</strong>
                              <span>{user.email}</span>
                            </div>
                          </td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`${styles.badge} ${user.status === 'suspended' ? styles.badgeSuspended : styles.badgeActive}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>{formatDate(user.joinedAt)}</td>
                          <td>
                            {isLocked ? (
                              <span className={styles.muted}>Protected</span>
                            ) : (
                              <Button
                                size="sm"
                                variant={user.status === 'active' ? 'secondary' : 'primary'}
                                onClick={() => handleStatusChange(user._id, user.status === 'active' ? 'suspended' : 'active')}
                                disabled={busyId === user._id}
                              >
                                {busyId === user._id ? 'Working…' : user.status === 'active' ? 'Suspend' : 'Reactivate'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Recent groups">
              <div className={styles.groupList}>
                {groups.length === 0 ? (
                  <p className={styles.empty}>No groups found.</p>
                ) : (
                  groups.slice(0, 8).map((group) => (
                    <article key={group._id} className={styles.groupCard}>
                      <div>
                        <h3>{group.name}</h3>
                        <p>{group.createdBy?.username ? `Created by ${group.createdBy.username}` : 'Community group'}</p>
                      </div>
                      <div className={styles.groupMeta}>
                        <span>{group.members?.length ?? 0} members</span>
                        <span>{formatDate(group.createdAt)}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </Section>
          </div>
        </div>
      </main>
    </div>
  )
}

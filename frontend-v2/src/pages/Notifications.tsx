import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCheck, Trash2, X } from 'lucide-react'
import { io, type Socket } from 'socket.io-client'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { relativeDay } from '../lib/format'
import { fetchNotifications, iconForNotification, mapNotification, type AppNotification } from '../lib/notifications'
import type { User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './Notifications.module.css'

function destination(n: AppNotification): string | null {
  if (!n.relatedId) return null
  switch (n.type) {
    case 'FRIEND_REQUEST': return '/groups'
    case 'GROUP_INVITATION':
    case 'TRIP_INVITATION':
    case 'EXPENSE_ADDED':
    case 'RECURRING_EXPENSE': return `/groups/${n.relatedId}`
    case 'CHAT_MESSAGE': return '/chat'
    default: return null
  }
}

export function NotificationsPage() {
  const [me, setMe] = useState<User | null>(null)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const [profileRes, list] = await Promise.all([
        fetch('/api/my-profile'), fetchNotifications(),
      ])
      if (profileRes.status === 401) { navigate('/login'); return }
      const profile = profileRes.ok ? await profileRes.json() : null
      if (profile?.user) setMe(profile.user)
      setItems(list)
    } catch (err: any) {
      if (err?.status === 401) { navigate('/login'); return }
      setError(err instanceof Error ? err.message : 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { load() }, [load])

  // Live updates: prepend new notifications pushed over the user room.
  useEffect(() => {
    if (!me) return
    const socket = io({ path: '/socket.io' })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('joinUser', me.id))
    socket.on('newNotification', (raw: any) => {
      const next = mapNotification(raw)
      setItems((prev) => (prev.some((n) => n.id === next.id) ? prev : [next, ...prev]))
    })
    return () => { socket.disconnect(); socketRef.current = null }
  }, [me?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const unread = items.filter((n) => !n.isRead).length

  async function markRead(n: AppNotification) {
    if (n.isRead) return
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
    await fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => { /* state already updated */ })
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      const unreadItems = items.filter((n) => !n.isRead)
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
      await Promise.all(unreadItems.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => null)))
    } finally {
      setMarkingAll(false)
    }
  }

  async function remove(n: AppNotification) {
    setItems((prev) => prev.filter((x) => x.id !== n.id))
    await fetch(`/api/notifications/${n.id}`, { method: 'DELETE' }).catch(() => { /* state already updated */ })
  }

  async function clearAll() {
    setItems([])
    await fetch('/api/notifications/user/all', { method: 'DELETE' }).catch(() => { /* state already updated */ })
  }

  if (loading) return <div className={styles.state}>Loading notifications…</div>
  if (error || !me) {
    return (
      <div className={styles.state} role="alert">
        <p>{error || 'Notifications are unavailable.'}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className={pageStyles.app}>
      <Sidebar me={me} />
      <main className={pageStyles.main}>
        <div className={styles.content}>
          <header className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>Activity</p>
              <h1>Notifications</h1>
              <p>{unread > 0 ? `You have ${unread} unread ${unread === 1 ? 'notification' : 'notifications'}.` : 'You are all caught up.'}</p>
            </div>
            {items.length > 0 && (
              <span className={styles.headingActions}>
                <Button size="sm" icon={<CheckCheck size={15} />} onClick={markAllRead} disabled={markingAll || unread === 0}>
                  Mark all read
                </Button>
                <Button size="sm" icon={<Trash2 size={15} />} onClick={clearAll}>
                  Clear all
                </Button>
              </span>
            )}
          </header>

          {items.length === 0 ? (
            <Card className={styles.empty}>
              <h2>No notifications yet</h2>
              <p>Friend requests, group invites, and expense updates will show up here.</p>
            </Card>
          ) : (
            <ul className={styles.list}>
              {items.map((n) => {
                const Icon = iconForNotification(n.type)
                const to = destination(n)
                const body = (
                  <>
                    <span className={styles.icon}><Icon size={18} strokeWidth={1.6} aria-hidden /></span>
                    <span className={styles.main}>
                      <strong>{n.title}</strong>
                      <span>{n.message}</span>
                      <small>
                        {n.senderName ? `From ${n.senderName} · ` : ''}{relativeDay(n.createdAt, new Date())}
                      </small>
                    </span>
                    {!n.isRead && <span className={styles.dot} aria-label="Unread" />}
                  </>
                )
                return (
                  <li key={n.id} className={`${styles.row} ${n.isRead ? '' : styles.unread}`}>
                    {to ? (
                      <Link to={to} className={styles.rowLink} onClick={() => markRead(n)}>{body}</Link>
                    ) : (
                      <button type="button" className={styles.rowButton} onClick={() => markRead(n)}>{body}</button>
                    )}
                    <button type="button" className={styles.delete} onClick={() => remove(n)} aria-label={`Delete notification: ${n.title}`}>
                      <X size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

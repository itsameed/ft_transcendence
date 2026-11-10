import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { io, type Socket } from 'socket.io-client'
import { NOTIFICATIONS_CHANGED, fetchNotifications } from '../../lib/notifications'
import styles from './Sidebar.module.css'

const POLL_MS = 60_000

/** Bell nav item with a live unread badge. Count comes from the API; socket pushes bump it. */
export function NotificationBell({ userId }: { userId: string }) {
  const [unread, setUnread] = useState(0)
  const socketRef = useRef<Socket | null>(null)

  const refresh = useCallback(async () => {
    try {
      const list = await fetchNotifications()
      setUnread(list.filter((n) => !n.isRead).length)
    } catch {
      // best-effort: keep the last known count
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, POLL_MS)
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh)
    }
  }, [refresh])

  useEffect(() => {
    const socket = io({ path: '/socket.io' })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('joinUser', userId))
    socket.on('newNotification', () => setUnread((count) => count + 1))
    return () => { socket.disconnect(); socketRef.current = null }
  }, [userId])

  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'

  return (
    <NavLink
      to="/notifications"
      className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
      aria-label={label}
      onClick={() => setUnread(0)}
    >
      <span className={styles.bellWrap}>
        <Bell size={18} strokeWidth={1.75} />
        {unread > 0 && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
      </span>
      Notifications
    </NavLink>
  )
}

import {
  Bell, Clock, CreditCard, MessageSquare, Receipt, UserPlus, Users, type LucideIcon,
} from 'lucide-react'

export type NotificationType =
  | 'GROUP_INVITATION' | 'FRIEND_REQUEST' | 'EXPENSE_ADDED' | 'PAYMENT_RECEIVED'
  | 'TRIP_INVITATION' | 'CHAT_MESSAGE' | 'RECURRING_EXPENSE'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  senderName: string | null
  relatedId: string | null
  isRead: boolean
  createdAt: string
}

export const notificationIcon: Record<NotificationType, LucideIcon> = {
  GROUP_INVITATION: Users,
  FRIEND_REQUEST: UserPlus,
  EXPENSE_ADDED: Receipt,
  PAYMENT_RECEIVED: CreditCard,
  TRIP_INVITATION: Users,
  CHAT_MESSAGE: MessageSquare,
  RECURRING_EXPENSE: Clock,
}

export function iconForNotification(type: string): LucideIcon {
  return notificationIcon[type as NotificationType] ?? Bell
}

/** Map the API payload (array of Mongo docs) into UI shape. */
export function mapNotification(raw: any): AppNotification {
  return {
    id: String(raw?._id ?? raw?.id ?? ''),
    type: (raw?.type ?? 'CHAT_MESSAGE') as NotificationType,
    title: raw?.title ?? 'Notification',
    message: raw?.message ?? '',
    senderName: raw?.senderId?.username ?? raw?.senderName ?? null,
    relatedId: raw?.relatedId ? String(raw.relatedId) : null,
    isRead: Boolean(raw?.isRead),
    createdAt: raw?.createdAt ?? new Date().toISOString(),
  }
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await fetch('/api/notifications')
  if (res.status === 401) throw Object.assign(new Error('unauthorized'), { status: 401 })
  if (!res.ok) throw new Error('Could not load notifications.')
  const data = await res.json()
  return (Array.isArray(data) ? data : []).map(mapNotification)
}

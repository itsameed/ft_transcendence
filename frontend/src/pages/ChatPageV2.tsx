import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import {
  ArrowLeft, BellOff, CheckCheck, CirclePlus,
  MessageSquare, Pin, SendHorizonal,
  Smile, Sparkles, Wallet, X,
} from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { useDialog } from '../lib/a11y'
import { Toast, type ToastTone } from '../components/ui/Toast'
import { AddExpenseModal } from '../components/dashboard/AddExpenseModal'
import { CreateGroupModal } from '../components/groups/CreateGroupModal'
import { iconForKind } from '../lib/GroupKinds'
import { firstName, money, relativeDay } from '../lib/format'
import { sendReminder } from '../lib/remind'
import type { Group, User } from '../types'
import dashStyles from './Dashboard.module.css'
import styles from './ChatNew.module.css'

interface ApiGroup { _id: string; name: string; kind: string; conversationId?: string; members: { role?: string; userId: { _id: string; username: string; email: string; avatar?: string | null } }[] }
interface ApiConversation { _id: string; participants: (string | { _id: string; username?: string; avatar?: string | null } | null)[] }
interface DmConv { conversationId: string; other: User; participants: string[] }
interface Msg { id: string; senderId: string; senderName: string; content: string; createdAt: string; ai?: boolean }
interface GroupExpense { id: string; title: string; category: string; amount: number; paidBy: User; date: string; myShare: number | null; shares: { userId: string; amount: number }[] | null }
type Mode = 'group' | 'ai'
type Filter = 'all' | 'unread' | 'groups' | 'settled'
type LocalMap = Record<string, string>

const AI_SUGGESTIONS = ['Who owes whom?', 'How do we settle up fastest?', 'What did we spend on?', 'Draft a payment reminder']
const QUICK_EMOJI = ['👍', '❤️', '😂', '🎉', '👀', '🙏']
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const loadLocal = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? '') as T } catch { return fallback } }
const saveLocal = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode */ } }

function parseSSE(chunk: string, onEvent: (name: string, data: any) => void) {
  for (const block of chunk.split('\n\n')) {
    const name = /^event: (.+)$/m.exec(block)?.[1]
    const data = /^data: (.+)$/m.exec(block)?.[1]
    if (name && data) { try { onEvent(name, JSON.parse(data)) } catch { /* partial */ } }
  }
}

export function ChatPage() {
  const [me, setMe] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('group')
  const [messages, setMessages] = useState<Msg[]>([])
  const [aiMessages, setAiMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [mobileThread, setMobileThread] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [addingExpense, setAddingExpense] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useDialog(pickerOpen, () => setPickerOpen(false))
  const emojiToggleRef = useRef<HTMLButtonElement>(null)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [friends, setFriends] = useState<User[]>([])
  const [dms, setDms] = useState<DmConv[]>([])
  const [dmTarget, setDmTarget] = useState<User | null>(null)
  const [dmBusy, setDmBusy] = useState(false)
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [globalDebts, setGlobalDebts] = useState<{ user: User; amount: number }[]>([])
  const [recentBalances, setRecentBalances] = useState<Record<string, number>>({})
  const [pinned, setPinned] = useState<LocalMap>(() => loadLocal('splitify-chat-pinned', {}))
  const [muted] = useState<Record<string, boolean>>(() => loadLocal('splitify-chat-muted', {}))
  const [readAt, setReadAt] = useState<Record<string, string>>(() => loadLocal('splitify-chat-read', {}))
  const [typingName, setTypingName] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<number>()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const selected = groups.find((g) => g.id === selectedId) ?? null
  const thread = mode === 'group' ? messages : aiMessages
  const activeConvId = dmTarget && selected === null ? dms.find((d) => d.other.id === dmTarget.id)?.conversationId : selected?.conversationId
  const inDm = Boolean(dmTarget) && !selected

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    setToast({ message, tone })
  }, [])

  useEffect(() => { saveLocal('splitify-chat-pinned', pinned) }, [pinned])
  useEffect(() => { saveLocal('splitify-chat-read', readAt) }, [readAt])

  useEffect(() => {
    async function load() {
      try {
        const [groupsRes, profileRes, dashRes] = await Promise.all([fetch('/api/groups/me'), fetch('/api/my-profile'), fetch('/api/dashboard')])
        if (groupsRes.status === 401 || profileRes.status === 401) { navigate('/login'); return }
        const profile = profileRes.ok ? await profileRes.json() : null
        if (profile?.user) setMe(profile.user)
        if (dashRes.ok) {
          const dash = await dashRes.json().catch(() => null)
          const rd = dash?.debts?.userRecentDebts
          const byUser = new Map<string, { user: User; amount: number }>()
          const addDebt = (item: any, sign: 1 | -1) => {
            if (!item?.user) return
            const id = String(item.user._id)
            const amount = Number(item.totalAmount ?? 0)
            if (!id || !Number.isFinite(amount) || amount === 0) return
            const prev = byUser.get(id)
            byUser.set(id, { user: prev?.user ?? { id, name: item.user.username, email: item.user.email ?? '', avatar: item.user.avatar ?? null }, amount: Math.round(((prev?.amount ?? 0) + sign * amount) * 100) / 100 })
          }
          for (const item of rd?.youOwe ?? []) addDebt(item, -1)
          for (const item of rd?.oweYou ?? []) addDebt(item, 1)
          setGlobalDebts([...byUser.values()].filter((d) => d.amount !== 0))
          const balances: Record<string, number> = {}
          for (const g of dash?.groups?.userRecentGroups ?? []) balances[String(g.groupId)] = Number(g.balance ?? 0)
          setRecentBalances(balances)
        }
        const data = groupsRes.ok ? await groupsRes.json() : { groups: [] }
        const userMap: Record<string, User> = {}
        if (profile?.user) userMap[profile.user.id] = profile.user
        const mapped: Group[] = (data.groups ?? []).map((g: ApiGroup) => {
          for (const m of g.members ?? []) if (m.userId) userMap[m.userId._id] = { id: m.userId._id, name: m.userId.username, email: m.userId.email, avatar: m.userId.avatar ?? null }
          return { id: g._id, name: g.name, emoji: '', kind: (g.kind || 'other') as Group['kind'], memberIds: (g.members ?? []).map((m) => m.userId._id), totalSpent: 0, yourBalance: 0, createdAt: '', conversationId: g.conversationId }
        })
        setUsers(userMap); setGroups(mapped)
        const wanted = params.get('group')
        setSelectedId(mapped.find((g) => g.id === wanted)?.id ?? mapped[0]?.id ?? null)
        fetch('/api/friends').then((r) => (r.ok ? r.json() : null)).then((d) => {
          if (d?.friends) setFriends(d.friends.map((f: any) => ({ id: String(f._id), name: f.username, email: f.email ?? '', avatar: f.avatar ?? null })))
        }).catch(() => { /* picker shows an empty state */ })
        fetch('/api/conversations').then((r) => (r.ok ? r.json() : null)).then((list) => {
          if (!Array.isArray(list) || !profile?.user) return
          const mine = String(profile.user.id)
          const groupConvIds = new Set(mapped.map((g) => g.conversationId).filter(Boolean))
          const dmList: DmConv[] = []
          for (const c of list as ApiConversation[]) {
            const participants = c.participants ?? []
            const parts = participants
              .map((participant) => typeof participant === 'string' ? participant : String(participant?._id ?? ''))
              .filter(Boolean)
            if (parts.length !== 2 || groupConvIds.has(String(c._id))) continue
            for (const participant of participants) {
              if (!participant || typeof participant === 'string') continue
              const id = String(participant._id)
              userMap[id] = {
                id,
                name: participant.username ?? 'Unknown member',
                email: '',
                avatar: participant.avatar ?? null,
              }
            }
            const otherId = parts.find((p) => p !== mine)
            if (!otherId) continue
            dmList.push({ conversationId: String(c._id), participants: parts, other: userMap[otherId] ?? { id: otherId, name: 'Unknown member', email: '' } })
          }
          setUsers(userMap)
          setDms(dmList)
        }).catch(() => { /* DM section stays empty */ })
      } catch { setError('Failed to load conversations') } finally { setLoading(false) }
    }
    load()
  }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Real per-group expenses: totals for the list, cards + debts for details.
  useEffect(() => {
    if (!selected || !me) return
    let cancelled = false
    fetch(`/api/groups/${selected.id}/expenses`)
      .then(async (r) => {
        if (cancelled) return
        if (!r.ok) { setExpenses([]); return }
        const data = await r.json()
        const rows = (Array.isArray(data) ? data : data.expenses ?? []) as any[]
        const mapped: GroupExpense[] = rows.map((e) => {
          const payerRaw = e.payer ?? e.paidBy
          const payer: User = { id: String(payerRaw?._id ?? payerRaw?.id ?? payerRaw ?? ''), name: payerRaw?.username ?? payerRaw?.name ?? 'Unknown', email: payerRaw?.email ?? '', avatar: payerRaw?.avatar ?? null }
          const shares = Array.isArray(e.shares) ? e.shares.map((s: any) => ({ userId: String(s.userId?._id ?? s.userId), amount: Number(s.amount ?? 0) })) : null
          return {
            id: String(e._id ?? e.id ?? `${e.description}-${e.date}`), title: e.description ?? e.title ?? 'Expense',
            category: e.category ?? 'other', amount: Number(e.amount ?? 0), paidBy: payer,
            date: e.date ?? e.createdAt ?? new Date().toISOString(),
            myShare: e.myShare != null ? Number(e.myShare) : shares?.find((s: { userId: string }) => s.userId === me.id)?.amount ?? null, shares,
          }
        }).sort((a, b) => +new Date(b.date) - +new Date(a.date))
        if (!cancelled) setExpenses(mapped)
      })
      .catch(() => { if (!cancelled) setExpenses([]) })
    return () => { cancelled = true }
  }, [selected?.id, me?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    let cancelled = false
    fetch(`/api/conversations/${activeConvId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        if (!cancelled) setMessages((Array.isArray(data) ? data : []).map((m) => ({
          id: m._id, senderId: m.senderId?._id ?? m.senderId, senderName: m.senderId?.username ?? 'Unknown',
          content: m.content, createdAt: m.createdAt,
        })))
      }).catch(() => { if (!cancelled) setMessages([]) })
    return () => { cancelled = true }
  }, [activeConvId])

  useEffect(() => {
    if (!me || !activeConvId) return
    const socket = io({ path: '/socket.io' })
    socketRef.current = socket
    socket.on('connect', () => {
      socket.emit('joinUser', me.id)
      socket.emit('joinConversation', activeConvId, me.id)
    })
    socket.on('newMessage', (m: any) => {
      if (m.conversationId !== activeConvId) return
      setMessages((prev) => prev.some((x) => x.id === m._id) ? prev : [...prev, {
        id: m._id, senderId: m.senderId?._id ?? m.senderId, senderName: m.senderId?.username ?? 'Unknown', content: m.content, createdAt: m.createdAt,
      }])
      if (String(m.senderId?._id ?? m.senderId) !== me.id) {
        setTypingName(m.senderId?.username ?? 'Someone')
        window.clearTimeout(typingTimer.current)
        typingTimer.current = window.setTimeout(() => setTypingName(null), 2500)
      }
    })
    return () => { socket.disconnect(); socketRef.current = null }
  }, [me?.id, activeConvId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    bottomRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }, [thread.length, mode, selectedId, typingName])
  useEffect(() => {
    if (activeConvId) setReadAt((p) => ({ ...p, [activeConvId]: new Date().toISOString() }))
  }, [activeConvId, messages.length])

  const expenseCount = useMemo(() => expenses.length, [expenses])
  const totalSpent = useMemo(() => expenses.reduce((a, e) => a + e.amount, 0), [expenses])
  const debts = useMemo(() => {
    if (!me) return [] as { user: User; amount: number }[]
    const net = new Map<string, number>()
    for (const e of expenses) {
      if (!e.shares) continue
      if (e.paidBy.id === me.id) {
        for (const s of e.shares) if (s.userId !== me.id) net.set(s.userId, (net.get(s.userId) ?? 0) + s.amount)
      } else {
        const mine = e.shares.find((s) => s.userId === me.id)
        if (mine) net.set(e.paidBy.id, (net.get(e.paidBy.id) ?? 0) - mine.amount)
      }
    }
    return [...net.entries()].map(([userId, amount]) => ({ user: users[userId] ?? { id: userId, name: 'Unknown member', email: '' }, amount: Math.round(amount * 100) / 100 })).filter((d) => d.amount !== 0)
  }, [expenses, me, users])
  const shareBalance = useMemo(() => debts.reduce((a, d) => a + d.amount, 0), [debts])
  const balanceKnown = expenses.some((e) => e.shares)
  const myBalance = balanceKnown ? shareBalance : (selected ? recentBalances[selected.id] ?? 0 : 0)
  const detailDebts = balanceKnown ? debts : globalDebts.filter((d) => selected?.memberIds.includes(d.user.id))
  const topDebtor = detailDebts.filter((d) => d.amount > 0).sort((a, b) => b.amount - a.amount)[0] as { user: User; amount: number } | undefined

  const pinnedMsg = selected ? messages.find((m) => m.id === pinned[selected.id]) : undefined
  const visibleGroups = groups.filter((g) => {
    if (filter === 'unread') return false // no server unread source; honest empty state below
    if (filter === 'settled') return (recentBalances[g.id] ?? 0) === 0
    return true
  })

  async function sendGroup() {
    const content = draft.trim()
    if (!content || !activeConvId) return
    setDraft('')
    const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
    })
    if (!res.ok) { setDraft(content); notify('Could not send — please try again', 'error'); return }
    const m = await res.json()
    setMessages((prev) => prev.some((x) => x.id === m._id) ? prev : [...prev, { id: m._id, senderId: me!.id, senderName: me!.name, content: m.content, createdAt: m.createdAt }])
  }

  async function askAI(text?: string) {
    const question = (text ?? draft).trim()
    if (!question || !selected || streaming) return
    setDraft(''); setStreaming(true)
    const aiId = `ai-${Date.now()}`
    setAiMessages((p) => [...p,
      { id: `q-${Date.now()}`, senderId: me!.id, senderName: me!.name, content: question, createdAt: new Date().toISOString() },
      { id: aiId, senderId: 'ai', senderName: 'Splitify AI', content: '', createdAt: new Date().toISOString(), ai: true }])
    try {
      const res = await fetch(`/api/chat/group/${selected.id}/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }),
      })
      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = ''
      for (;;) {
        const { done, value } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n'); buffer = parts.pop() ?? ''
        parseSSE(parts.join('\n\n') + '\n\n', (name, data) => {
          if (name === 'token') setAiMessages((p) => p.map((m) => m.id === aiId ? { ...m, content: m.content + (data.text ?? '') } : m))
          if (name === 'error') setAiMessages((p) => p.map((m) => m.id === aiId ? { ...m, content: data.message ?? 'An error occurred.' } : m))
        })
      }
    } catch {
      setAiMessages((p) => p.map((m) => m.id === aiId ? { ...m, content: 'Could not reach the AI — please try again.' } : m))
    } finally { setStreaming(false) }
  }

  async function startDm(friend: User) {
    const existing = dms.find((d) => d.other.id === friend.id)
    setPickerOpen(false)
    if (existing) { setSelectedId(null); setDmTarget(existing.other); setMode('group'); setMobileThread(true); return }
    setDmBusy(true)
    try {
      const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: friend.id }) })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?._id) throw new Error(data?.message ?? 'Could not start the conversation.')
      const conv: DmConv = { conversationId: String(data._id), participants: (data.participants ?? []).map(String), other: friend }
      setDms((p) => [conv, ...p.filter((d) => d.conversationId !== conv.conversationId)])
      setUsers((p) => ({ ...p, [friend.id]: friend }))
      setSelectedId(null); setDmTarget(friend); setMode('group'); setMobileThread(true)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not start the conversation.', 'error')
    } finally { setDmBusy(false) }
  }

  function togglePin(m: Msg) {
    if (!selected) return
    setPinned((p) => ({ ...p, [selected.id]: p[selected.id] === m.id ? '' : m.id }))
    notify(pinned[selected.id] === m.id ? 'Message unpinned' : 'Message pinned to this conversation', 'success')
  }

  if (loading || !me) return <div className="page-state" role={error ? 'alert' : 'status'}>{error ?? 'Loading…'}</div>

  const GroupIcon = selected ? iconForKind(selected.kind) : MessageSquare
  const memberUsers = selected ? selected.memberIds.map((id) => users[id] ?? { id, name: 'Unknown member', email: '' }) : []

  return (
    <div className={dashStyles.app}>
      <Sidebar me={me} />
      <main className={`${dashStyles.main} ${styles.chatMain}`}>
        <div className={`${styles.shell} ${mobileThread ? styles.mobileThread : ''}`}>
          <aside className={styles.list} aria-label="Conversations">
            <div className={styles.listHead}>
              <div className={styles.listTitle}><h1>Messages</h1>
                <button className={`${styles.iconBtn} ${styles.primary}`} aria-label="New conversation" onClick={() => setPickerOpen(true)}><CirclePlus size={19} /></button></div>
            </div>
            <div className={styles.filters} role="group" aria-label="Filter conversations">
              {/* "Unread" returns once the server tracks read state. */}
              {([['all', 'All'], ['groups', 'Groups'], ['settled', 'Settled']] as [Filter, string][]).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={filter === id} className={`${styles.chip} ${filter === id ? styles.chipOn : ''}`} onClick={() => setFilter(id)}>{label}</button>
              ))}
            </div>
            <div className={styles.listScroll}>
              {groups.length === 0 && <div className={styles.emptyList}><strong>No groups yet</strong>Join or create a group to start chatting.</div>}
              {filter === 'unread' && (
                <div className={styles.emptyList}><strong>Nothing to show here yet</strong>
                  {filter === 'unread' ? 'Unread counts are not tracked by the server yet, so this filter stays empty for now.' : 'No settled groups match.'}</div>
              )}
              {(filter === 'all' || filter === 'groups' || filter === 'settled') && visibleGroups.length === 0 && groups.length > 0 && (
                <div className={styles.emptyList}><strong>{filter === 'settled' ? 'No settled groups match' : 'No conversations found'}</strong>{filter === 'settled' ? 'Groups with an open balance are hidden here.' : 'Try another search.'}</div>
              )}
              {dms.length > 0 && filter === 'all' && (
                <>
                  <p className={styles.listLabel}>Direct messages</p>
                  {dms.map((d) => (
                    <button key={d.conversationId} className={`${styles.conv} ${inDm && dmTarget?.id === d.other.id ? styles.convOn : ''}`} onClick={() => { setSelectedId(null); setDmTarget(d.other); setMode('group'); setMobileThread(true) }} aria-current={inDm && dmTarget?.id === d.other.id}>
                      <Avatar user={d.other} size={40} />
                      <span className={styles.convBody}>
                        <span className={styles.convTop}><span className={styles.convName}>{d.other.name}</span></span>
                        <span className={styles.convLast}><span>Direct message</span></span>
                      </span>
                    </button>
                  ))}
                </>
              )}
              {(filter === 'all' || filter === 'groups' || filter === 'settled') && <p className={styles.listLabel}>Groups</p>}
              {(filter === 'all' || filter === 'groups' || filter === 'settled') && visibleGroups.map((g) => {
                const Icon = iconForKind(g.kind)
                const isSelected = selectedId === g.id
                return (
                  <div key={g.id}>
                    <button className={`${styles.conv} ${isSelected && mode === 'group' ? styles.convOn : ''}`} onClick={() => { setSelectedId(g.id); setDmTarget(null); setMode('group'); setMobileThread(true) }} aria-current={isSelected && mode === 'group'}>
                      <span className={styles.convIcon}><Icon size={19} /></span>
                      <span className={styles.convBody}>
                        <span className={styles.convTop}><span className={styles.convName}>{g.name}</span></span>
                        <span className={styles.convLast}><span>{isSelected && expenses.length ? `${expenses.length} expenses · ${money(totalSpent)} spent` : `${g.memberIds.length} ${g.memberIds.length === 1 ? 'member' : 'members'} · ${(isSelected ? myBalance : (recentBalances[g.id] ?? 0)) > 0 ? `You are owed ${money(isSelected ? myBalance : recentBalances[g.id])}` : (isSelected ? myBalance : (recentBalances[g.id] ?? 0)) < 0 ? `You owe ${money(isSelected ? myBalance : recentBalances[g.id])}` : 'Settled'}`}</span>
                          {muted[g.id] && <BellOff size={13} style={{ flex: 'none', color: 'var(--text-3)' }} />}</span>
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </aside>

          <section className={styles.thread} aria-label="Conversation">
            {!selected && !inDm ? <p className={styles.emptyList}>Select a conversation.</p> : (
              <>
                <header className={styles.threadHead}>
                  <button className={`${styles.iconBtn} ${styles.backBtn}`} onClick={() => setMobileThread(false)} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
                  <div className={styles.threadId}>
                    {inDm && dmTarget
                      ? <><Avatar user={dmTarget} size={38} /><span style={{ minWidth: 0 }}><span className={styles.threadName}>{dmTarget.name}</span><span className={styles.threadSub}>Direct message</span></span></>
                      : <><span className={styles.convIcon}>{mode === 'ai' ? <Sparkles size={18} /> : <GroupIcon size={19} />}</span>
                        <span style={{ minWidth: 0 }}><span className={styles.threadName}>{mode === 'ai' ? `Ask AI · ${selected!.name}` : selected!.name}</span>
                          <span className={styles.threadSub}>{mode === 'ai' ? 'Knows this group’s expenses and balances' : `${selected!.memberIds.length} ${selected!.memberIds.length === 1 ? 'member' : 'members'}`}</span></span></>}
                  </div>
                  {!inDm && <span className={styles.memberFaces}>{memberUsers.slice(0, 3).map((u) => <Avatar key={u.id} user={u} size={28} />)}</span>}
                </header>

                <div className={styles.scrollCol}>
                  {!inDm && (
                    <div className={styles.modeSwitch} role="group" aria-label="Chat mode">
                      <button type="button" aria-pressed={mode === 'group'} className={mode === 'group' ? styles.modeOn : ''} onClick={() => setMode('group')}><MessageSquare size={15} aria-hidden /> Group chat</button>
                      <button type="button" aria-pressed={mode === 'ai'} className={mode === 'ai' ? styles.modeOn : ''} onClick={() => setMode('ai')}><Sparkles size={15} aria-hidden /> Ask AI</button>
                    </div>
                  )}

                  {mode === 'group' && !inDm && (balanceKnown || myBalance !== 0) && (
                    <div className={styles.balanceStrip} role="status">
                      <Wallet size={19} style={{ flex: 'none', color: myBalance > 0 ? 'var(--owed)' : myBalance < 0 ? 'var(--owe)' : 'var(--text-3)' }} />
                      <span className={styles.grow}><strong>{myBalance > 0 ? `You’re owed ${money(myBalance)}` : myBalance < 0 ? `You owe ${money(myBalance)}` : 'You’re all settled up'}</strong>
                        <p>{balanceKnown ? `${money(totalSpent)} spent together · ${expenseCount} expenses` : 'Across your recent groups'}</p></span>
                      {myBalance > 0 && topDebtor && <button className={`${styles.stripBtn} ${styles.stripBtnBrand}`} onClick={async () => { const r = await sendReminder(topDebtor.user.id, firstName(topDebtor.user.name)); notify(r.message, r.ok ? 'success' : 'error') }}>Remind</button>}
                      {myBalance < 0 && selected && <Link className={`${styles.stripBtn} ${styles.stripBtnBrand}`} to={`/groups/${selected.id}`}>Settle up</Link>}
                      {selected && <Link className={styles.stripBtn} to={`/groups/${selected.id}`}>Balances</Link>}
                    </div>
                  )}
                  {mode === 'group' && pinnedMsg && (
                    <div className={styles.pinnedBar}><Pin size={14} style={{ flex: 'none' }} /><span><b>Pinned · </b>{pinnedMsg.content}</span>
                      <button aria-label="Unpin" onClick={() => togglePin(pinnedMsg)}><X size={14} /></button></div>
                  )}

                  <div className={styles.msgs} role="log" aria-label="Messages">
                    {thread.map((m, i) => {
                      const prev = thread[i - 1]
                      const day = relativeDay(m.createdAt, new Date())
                      const showDay = day !== (prev ? relativeDay(prev.createdAt, new Date()) : null)
                      const mine = m.senderId === me.id
                      const grouped = !!prev && prev.senderId === m.senderId && !showDay
                      const sender = users[m.senderId] ?? { id: m.senderId, name: m.senderName, email: '' }
                      return (
                        <div key={m.id} className={styles.msgRowWrap}>
                          {showDay && <div className={styles.dayDivider}><span>{day}</span></div>}
                          <div className={`${styles.msgRow} ${mine ? styles.mineRow : ''} ${grouped ? styles.grouped : ''}`}>
                            <span className={styles.avatarSlot}>{!grouped && !mine && (m.ai
                              ? <span className={`${styles.convIcon} ${styles.aiConvIcon}`} style={{ width: 32, height: 32, borderRadius: '50%' }}><Sparkles size={15} /></span>
                              : <Avatar user={sender} size={32} />)}</span>
                            <div className={styles.bubbleWrap}>
                              <div className={styles.bubble}>
                                {!grouped && !mine && !m.ai && <span className={styles.who}>{m.senderName}</span>}
                                {m.content || (m.ai ? '…' : '')}
                                <span className={styles.meta}>{timeOf(m.createdAt)}{mine && mode === 'group' && <CheckCheck size={13} />}</span>
                              </div>
                            </div>
                            {!inDm && <span className={styles.msgActions}>
                              <button className={styles.miniBtn} aria-label={selected && pinned[selected.id] === m.id ? 'Unpin' : 'Pin'} onClick={() => togglePin(m)}><Pin size={15} /></button>
                            </span>}
                          </div>
                        </div>
                      )
                    })}
                    {thread.length === 0 && <p className={styles.systemMsg}>{mode === 'ai' ? 'Ask anything about this group’s expenses.' : 'No messages yet — say hello.'}</p>}
                    <div ref={bottomRef} />
                  </div>

                  {mode === 'group' && typingName && <div className={styles.typingRow}><span className={styles.typingDots}><i /><i /><i /></span>{typingName} sent a message</div>}
                  {mode === 'ai' && streaming && <div className={styles.typingRow}><span className={styles.typingDots}><i /><i /><i /></span>Splitify AI is thinking…</div>}
                  {mode === 'ai' && !streaming && (
                    <div className={styles.suggestions}>{AI_SUGGESTIONS.map((s) => <button key={s} className={styles.suggestion} onClick={() => askAI(s)}><Sparkles size={13} />{s}</button>)}</div>
                  )}

                  <div
                    className={styles.composerZone}
                    onKeyDown={(e) => { if (e.key === 'Escape' && emojiOpen) { e.stopPropagation(); setEmojiOpen(false); emojiToggleRef.current?.focus() } }}
                  >
                    {emojiOpen && <div id="emoji-picker" className={styles.emojiPop} role="group" aria-label="Insert emoji">{QUICK_EMOJI.map((e) => <button type="button" key={e} aria-label={`Insert ${e}`} onClick={() => { setDraft((d) => d + e); setEmojiOpen(false); inputRef.current?.focus() }}>{e}</button>)}</div>}
                    <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); mode === 'group' ? sendGroup() : askAI() }}>
                      <textarea ref={inputRef} value={draft} rows={1} aria-label="Message"
                        placeholder={mode === 'ai' ? `Ask about ${selected?.name} expenses…` : inDm ? `Message ${dmTarget?.name}…` : `Message ${selected?.name}…`}
                        disabled={mode === 'group' && !activeConvId}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); mode === 'group' ? sendGroup() : askAI() } }} />
                      <button ref={emojiToggleRef} type="button" className={styles.composerBtn} aria-label="Emoji" aria-expanded={emojiOpen} aria-controls="emoji-picker" onClick={() => setEmojiOpen(!emojiOpen)}><Smile size={19} aria-hidden /></button>
                      <button type="submit" className={styles.sendBtn} disabled={streaming || !draft.trim()} aria-label={mode === 'ai' ? 'Ask' : 'Send'}><SendHorizonal size={18} aria-hidden /></button>
                    </form>
                    {mode === 'group' && !activeConvId && <p className={styles.composerHint}><span>This conversation is not available yet.</span></p>}
                    <div className={styles.composerHint}><span><kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line</span><span>{mode === 'ai' ? 'AI can make mistakes — verify amounts' : inDm ? dmTarget?.name : selected?.name}</span></div>
                  </div>
                </div>
              </>
            )}
          </section>

        </div>
      </main>
      <MobileNav onAdd={() => setAddingExpense(true)} />
      {pickerOpen && (
        <div className={styles.pickerBackdrop} onMouseDown={(e) => e.target === e.currentTarget && setPickerOpen(false)}>
          <div ref={pickerRef} className={styles.pickerDialog} role="dialog" aria-modal="true" aria-labelledby="new-conv-title">
            <div className={styles.pickerHead}>
              <h2 id="new-conv-title">New conversation</h2>
              <button className={styles.iconBtn} onClick={() => setPickerOpen(false)} aria-label="Close"><X size={17} /></button>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 14 }}>Message a friend directly, or start a new group.</p>
            <button className={styles.conv} style={{ border: '1px solid var(--border)', marginBottom: 14 }} onClick={() => { setPickerOpen(false); setCreatingGroup(true) }}>
              <span className={`${styles.convIcon} ${styles.aiConvIcon}`}><CirclePlus size={19} /></span>
              <span className={styles.convBody}><span className={styles.convName}>Create a new group</span><span className={styles.convLast}><span>Trip, home, event…</span></span></span>
            </button>
            <p className={styles.listLabel} style={{ paddingLeft: 2 }}>Friends</p>
            {friends.length === 0
              ? <p className={styles.detailsEmpty}>No friends yet — add friends from Groups &amp; Friends first.</p>
              : friends.map((f) => (
                <button key={f.id} className={styles.conv} disabled={dmBusy} onClick={() => startDm(f)}>
                  <Avatar user={f} size={40} />
                  <span className={styles.convBody}><span className={styles.convName}>{f.name}</span><span className={styles.convLast}><span>{f.email || 'Direct message'}</span></span></span>
                </button>
              ))}
          </div>
        </div>
      )}
      <CreateGroupModal open={creatingGroup} friends={friends} onClose={() => setCreatingGroup(false)}
        onCreated={(group) => {
          setCreatingGroup(false)
          setGroups((p) => [group, ...p])
          setSelectedId(group.id); setDmTarget(null); setMode('group'); setMobileThread(true)
          notify(`Created “${group.name}”`, 'success')
        }} />
      {addingExpense && (
        <AddExpenseModal open={addingExpense} onClose={() => setAddingExpense(false)}
          onSave={(expense, group) => { setAddingExpense(false); notify(`Added “${expense.title}” to ${group.name}`, 'success') }}
          groups={groups} users={users} me={me.id} today={new Date()} />
      )}
      <Toast message={toast?.message ?? null} tone={toast?.tone} duration={2600} onDismiss={() => setToast(null)} />
    </div>
  )
}

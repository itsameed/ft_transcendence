import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import {
  ArrowLeft, Bell, BellOff, CheckCheck, CirclePlus, Download, FileText, HandCoins,
  MessageSquare, Mic, MoreVertical, Phone, Pin, ReceiptText, Reply, Search, SendHorizonal,
  Smile, Sparkles, Trash2, Video, Wallet, X,
} from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Toast } from '../components/ui/Toast'
import { AddExpenseModal } from '../components/dashboard/AddExpenseModal'
import { iconForKind } from '../lib/GroupKinds'
import { categoryIcon } from '../lib/categories'
import { firstName, money, relativeDay } from '../lib/format'
import type { Group, User } from '../types'
import dashStyles from './Dashboard.module.css'
import styles from './ChatNew.module.css'

interface ApiGroup { _id: string; name: string; kind: string; conversationId?: string; members: { userId: { _id: string; username: string; email: string } }[] }
interface Msg { id: string; senderId: string; senderName: string; content: string; createdAt: string; ai?: boolean }
interface GroupExpense { id: string; title: string; category: string; amount: number; paidBy: User; date: string; myShare: number | null; shares: { userId: string; amount: number }[] | null }
type Mode = 'group' | 'ai'
type Filter = 'all' | 'unread' | 'groups' | 'settled'
type ReactionMap = Record<string, Record<string, string[]>>
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
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [details, setDetails] = useState(true)
  const [mobileThread, setMobileThread] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [addingExpense, setAddingExpense] = useState(false)
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [expensesNote, setExpensesNote] = useState('')
  const [globalDebts, setGlobalDebts] = useState<{ user: User; amount: number }[]>([])
  const [recentBalances, setRecentBalances] = useState<Record<string, number>>({})
  const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const [reactions, setReactions] = useState<ReactionMap>(() => loadLocal('splitify-chat-reactions', {}))
  const [pinned, setPinned] = useState<LocalMap>(() => loadLocal('splitify-chat-pinned', {}))
  const [muted, setMuted] = useState<Record<string, boolean>>(() => loadLocal('splitify-chat-muted', {}))
  const [readAt, setReadAt] = useState<Record<string, string>>(() => loadLocal('splitify-chat-read', {}))
  const [typingName, setTypingName] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const toastTimer = useRef<number>()
  const typingTimer = useRef<number>()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const selected = groups.find((g) => g.id === selectedId) ?? null
  const thread = mode === 'group' ? messages : aiMessages

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => { saveLocal('splitify-chat-reactions', reactions) }, [reactions])
  useEffect(() => { saveLocal('splitify-chat-pinned', pinned) }, [pinned])
  useEffect(() => { saveLocal('splitify-chat-muted', muted) }, [muted])
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
            byUser.set(id, { user: prev?.user ?? { id, name: item.user.username, email: item.user.email ?? '' }, amount: Math.round(((prev?.amount ?? 0) + sign * amount) * 100) / 100 })
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
          for (const m of g.members ?? []) if (m.userId) userMap[m.userId._id] = { id: m.userId._id, name: m.userId.username, email: m.userId.email }
          return { id: g._id, name: g.name, emoji: '', kind: (g.kind || 'other') as Group['kind'], memberIds: (g.members ?? []).map((m) => m.userId._id), totalSpent: 0, yourBalance: 0, createdAt: '', conversationId: g.conversationId }
        })
        setUsers(userMap); setGroups(mapped)
        const wanted = params.get('group')
        setSelectedId(mapped.find((g) => g.id === wanted)?.id ?? mapped[0]?.id ?? null)
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
        if (!r.ok) { setExpenses([]); setExpensesNote('Expenses are not available for this group yet.'); return }
        const data = await r.json()
        const rows = (Array.isArray(data) ? data : data.expenses ?? []) as any[]
        const mapped: GroupExpense[] = rows.map((e) => {
          const payerRaw = e.payer ?? e.paidBy
          const payer: User = { id: String(payerRaw?._id ?? payerRaw?.id ?? payerRaw ?? ''), name: payerRaw?.username ?? payerRaw?.name ?? 'Unknown', email: payerRaw?.email ?? '' }
          const shares = Array.isArray(e.shares) ? e.shares.map((s: any) => ({ userId: String(s.userId?._id ?? s.userId), amount: Number(s.amount ?? 0) })) : null
          return {
            id: String(e._id ?? e.id ?? `${e.description}-${e.date}`), title: e.description ?? e.title ?? 'Expense',
            category: e.category ?? 'other', amount: Number(e.amount ?? 0), paidBy: payer,
            date: e.date ?? e.createdAt ?? new Date().toISOString(),
            myShare: e.myShare != null ? Number(e.myShare) : shares?.find((s: { userId: string }) => s.userId === me.id)?.amount ?? null, shares,
          }
        }).sort((a, b) => +new Date(b.date) - +new Date(a.date))
        if (!cancelled) { setExpenses(mapped); setExpensesNote('') }
      })
      .catch(() => { if (!cancelled) { setExpenses([]); setExpensesNote('Expenses are not available for this group yet.') } })
    return () => { cancelled = true }
  }, [selected?.id, me?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected?.conversationId) { setMessages([]); return }
    let cancelled = false
    fetch(`/api/conversations/${selected.conversationId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        if (!cancelled) setMessages((Array.isArray(data) ? data : []).map((m) => ({
          id: m._id, senderId: m.senderId?._id ?? m.senderId, senderName: m.senderId?.username ?? 'Unknown',
          content: m.content, createdAt: m.createdAt,
        })))
      }).catch(() => { if (!cancelled) setMessages([]) })
    return () => { cancelled = true }
  }, [selected?.conversationId])

  useEffect(() => {
    if (!me || !selected?.conversationId) return
    const socket = io({ path: '/socket.io' })
    socketRef.current = socket
    socket.on('connect', () => {
      socket.emit('joinUser', me.id)
      socket.emit('joinConversation', selected.conversationId, me.id)
    })
    socket.on('newMessage', (m: any) => {
      if (m.conversationId !== selected.conversationId) return
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
  }, [me?.id, selected?.conversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.length, mode, selectedId, typingName])
  useEffect(() => {
    if (selected?.conversationId) setReadAt((p) => ({ ...p, [selected.conversationId!]: new Date().toISOString() }))
  }, [selected?.conversationId, messages.length])

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

  const pinnedMsg = selected ? messages.find((m) => m.id === pinned[selected.id]) : undefined
  const visibleGroups = groups.filter((g) => {
    const q = query.trim().toLowerCase()
    if (q && !g.name.toLowerCase().includes(q)) return false
    if (filter === 'unread') return false // no server unread source; honest empty handled below via counts
    if (filter === 'settled') return false
    return true
  })

  async function sendGroup() {
    const content = draft.trim()
    if (!content || !selected?.conversationId) return
    setDraft(''); setReplyTo(null)
    const res = await fetch(`/api/conversations/${selected.conversationId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
    })
    if (!res.ok) { setDraft(content); notify('Could not send — please try again'); return }
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

  function react(m: Msg) {
    setReactions((prev) => {
      const cur = { ...(prev[m.id] ?? {}) }
      const mine = cur['🎉']?.includes(me!.name)
      cur['🎉'] = mine ? (cur['🎉'] ?? []).filter((n) => n !== me!.name) : [...(cur['🎉'] ?? []), me!.name]
      if (!cur['🎉'].length) delete cur['🎉']
      return { ...prev, [m.id]: cur }
    })
  }
  function togglePin(m: Msg) {
    if (!selected) return
    setPinned((p) => ({ ...p, [selected.id]: p[selected.id] === m.id ? '' : m.id }))
    notify(pinned[selected.id] === m.id ? 'Message unpinned' : 'Message pinned to this conversation')
  }

  if (loading || !me) return <div className="page-state" role={error ? 'alert' : 'status'}>{error ?? 'Loading…'}</div>

  const GroupIcon = selected ? iconForKind(selected.kind) : MessageSquare
  const memberUsers = selected ? selected.memberIds.map((id) => users[id] ?? { id, name: 'Unknown member', email: '' }) : []

  return (
    <div className={dashStyles.app}>
      <Sidebar me={me} />
      <main className={`${dashStyles.main} ${styles.chatMain}`}>
        <div className={`${styles.shell} ${details ? styles.detailsOpen : ''} ${mobileThread ? styles.mobileThread : ''}`}>
          <aside className={styles.list} aria-label="Conversations">
            <div className={styles.listHead}>
              <div className={styles.listTitle}><h1>Messages</h1>
                <button className={`${styles.iconBtn} ${styles.primary}`} aria-label="New conversation" onClick={() => notify('Pick a group below — every group has its own conversation')}><CirclePlus size={19} /></button></div>
              <label className={styles.search}><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations…" aria-label="Search conversations" /></label>
            </div>
            <div className={styles.filters} role="tablist" aria-label="Filter conversations">
              {([['all', 'All'], ['unread', 'Unread'], ['groups', 'Groups'], ['settled', 'Settled']] as [Filter, string][]).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={filter === id} className={`${styles.chip} ${filter === id ? styles.chipOn : ''}`} onClick={() => setFilter(id)}>{label}</button>
              ))}
            </div>
            <div className={styles.listScroll}>
              {groups.length === 0 && <div className={styles.emptyList}><strong>No groups yet</strong>Join or create a group to start chatting.</div>}
              {filter !== 'all' && filter !== 'groups' && (
                <div className={styles.emptyList}><strong>Nothing to show here yet</strong>
                  {filter === 'unread' ? 'Unread counts are not tracked by the server yet, so this filter stays empty for now.' : 'Settled status comes from group balances, which are not loaded in chat yet.'}</div>
              )}
              {(filter === 'all' || filter === 'groups') && visibleGroups.length === 0 && groups.length > 0 && (
                <div className={styles.emptyList}><strong>No conversations found</strong>Try another search.</div>
              )}
              {(filter === 'all' || filter === 'groups') && visibleGroups.map((g) => {
                const Icon = iconForKind(g.kind)
                const isSelected = selectedId === g.id
                return (
                  <div key={g.id}>
                    <button className={`${styles.conv} ${isSelected && mode === 'group' ? styles.convOn : ''}`} onClick={() => { setSelectedId(g.id); setMode('group'); setMobileThread(true); setReplyTo(null) }} aria-current={isSelected && mode === 'group'}>
                      <span className={styles.convIcon}><Icon size={19} /></span>
                      <span className={styles.convBody}>
                        <span className={styles.convTop}><span className={styles.convName}>{g.name}</span><span className={styles.convTime}>{g.memberIds.length} {g.memberIds.length === 1 ? 'person' : 'people'}</span></span>
                        <span className={styles.convLast}><span>{isSelected && expenses.length ? `${expenses.length} expenses · ${money(totalSpent)} spent` : 'Group conversation'}</span>
                          {muted[g.id] && <BellOff size={13} style={{ flex: 'none', color: 'var(--text-3)' }} />}</span>
                        <span className={styles.convMeta}><span className={styles.pill}>{g.memberIds.length} members</span></span>
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </aside>

          <section className={styles.thread} aria-label="Conversation">
            {!selected ? <p className={styles.emptyList}>Select a conversation.</p> : (
              <>
                <header className={styles.threadHead}>
                  <button className={`${styles.iconBtn} ${styles.backBtn}`} onClick={() => setMobileThread(false)} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
                  <button className={styles.threadId} onClick={() => setDetails(!details)} aria-label="Toggle group details">
                    <span className={styles.convIcon}>{mode === 'ai' ? <Sparkles size={18} /> : <GroupIcon size={19} />}</span>
                    <span style={{ minWidth: 0 }}><span className={styles.threadName}>{mode === 'ai' ? `Ask AI · ${selected.name}` : selected.name}</span>
                      <span className={styles.threadSub}>{mode === 'ai' ? 'Knows this group’s expenses and balances' : `${selected.memberIds.length} members`}</span></span>
                  </button>
                  <span className={styles.memberFaces}>{memberUsers.slice(0, 3).map((u) => <Avatar key={u.id} user={u} size={28} />)}</span>
                  <div className={styles.headActions}>
                    <button className={`${styles.iconBtn} ${styles.hideMobile}`} aria-label="Search in conversation" onClick={() => notify('Search in conversation is not available yet')}><Search size={17} /></button>
                    <button className={styles.iconBtn} aria-label="Group details" onClick={() => setDetails(!details)} aria-pressed={details}><MoreVertical size={17} /></button>
                  </div>
                </header>

                <div className={styles.scrollCol}>
                  <div className={styles.modeSwitch} role="tablist" aria-label="Chat mode">
                    <button role="tab" aria-selected={mode === 'group'} className={mode === 'group' ? styles.modeOn : ''} onClick={() => setMode('group')}><MessageSquare size={15} /> Group chat</button>
                    <button role="tab" aria-selected={mode === 'ai'} className={mode === 'ai' ? styles.modeOn : ''} onClick={() => setMode('ai')}><Sparkles size={15} /> Ask AI</button>
                  </div>

                  {mode === 'group' && (balanceKnown || myBalance !== 0) && (
                    <div className={styles.balanceStrip} role="status">
                      <Wallet size={19} style={{ flex: 'none', color: myBalance > 0 ? 'var(--owed)' : myBalance < 0 ? 'var(--owe)' : 'var(--text-3)' }} />
                      <span className={styles.grow}><strong>{myBalance > 0 ? `You’re owed ${money(myBalance)}` : myBalance < 0 ? `You owe ${money(myBalance)}` : 'You’re all settled up'}</strong>
                        <p>{balanceKnown ? `${money(totalSpent)} spent together · ${expenseCount} expenses` : 'Across your recent groups'}</p></span>
                      {myBalance > 0 && <button className={`${styles.stripBtn} ${styles.stripBtnBrand}`} onClick={() => notify('Reminder noted — notifications are not sent from chat yet')}>Remind</button>}
                      {myBalance < 0 && <button className={`${styles.stripBtn} ${styles.stripBtnBrand}`} onClick={() => setDetails(true)}>Settle up</button>}
                      <button className={styles.stripBtn} onClick={() => setDetails(true)}>Balances</button>
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
                      const msgReactions = reactions[m.id] ?? {}
                      return (
                        <div key={m.id} className={styles.msgRowWrap}>
                          {showDay && <div className={styles.dayDivider}><span>{day}</span></div>}
                          <div className={`${styles.msgRow} ${mine ? styles.mineRow : ''} ${grouped ? styles.grouped : ''}`}>
                            <span className={styles.avatarSlot}>{!grouped && !mine && (m.ai
                              ? <span className={`${styles.convIcon} ${styles.aiConvIcon}`} style={{ width: 32, height: 32, borderRadius: '50%' }}><Sparkles size={15} /></span>
                              : <Avatar user={sender} size={32} />)}</span>
                            <div className={styles.bubbleWrap}>
                              <div className={styles.bubble}>
                                {m.ai && <span className={styles.aiTag}><Sparkles size={11} /> Splitify AI</span>}
                                {!grouped && !mine && !m.ai && <span className={styles.who}>{m.senderName}</span>}
                                {m.id === replyTo?.id && null}
                                {m.content || (m.ai ? '…' : '')}
                                <span className={styles.meta}>{timeOf(m.createdAt)}{mine && mode === 'group' && <CheckCheck size={13} />}</span>
                              </div>
                              {Object.keys(msgReactions).length > 0 && (
                                <div className={styles.reactions}>{Object.entries(msgReactions).map(([emoji, by]) => (
                                  <button key={emoji} className={`${styles.reaction} ${by.includes(me.name) ? styles.reactionMine : ''}`} title={by.join(', ')} onClick={() => react(m)}>{emoji} {by.length}</button>
                                ))}</div>
                              )}
                            </div>
                            <span className={styles.msgActions}>
                              <button className={styles.miniBtn} aria-label="React" onClick={() => react(m)}><Smile size={15} /></button>
                              <button className={styles.miniBtn} aria-label="Reply" onClick={() => { setReplyTo(m); inputRef.current?.focus() }}><Reply size={15} /></button>
                              <button className={styles.miniBtn} aria-label={pinned[selected.id] === m.id ? 'Unpin' : 'Pin'} onClick={() => togglePin(m)}><Pin size={15} /></button>
                            </span>
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

                  <div className={styles.composerZone}>
                    {replyTo && (
                      <div className={styles.replyPreview}><Reply size={15} style={{ color: 'var(--text-2)', flex: 'none' }} /><span className={styles.grow}>Replying to <b>{replyTo.senderName}</b> · {replyTo.content}</span>
                        <button className={styles.miniBtn} onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={14} /></button></div>
                    )}
                    {replyTo && <p className={styles.composerHint}><span>Replies are visual only here — your message is sent as a normal message.</span></p>}
                    {emojiOpen && <div className={styles.emojiPop}>{QUICK_EMOJI.map((e) => <button key={e} onClick={() => { setDraft((d) => d + e); inputRef.current?.focus() }}>{e}</button>)}</div>}
                    <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); mode === 'group' ? sendGroup() : askAI() }}>
                      <button type="button" className={styles.composerBtn} aria-label="Add expense" onClick={() => setAddingExpense(true)}><ReceiptText size={19} /></button>
                      <textarea ref={inputRef} value={draft} rows={1} aria-label="Message"
                        placeholder={mode === 'ai' ? `Ask about ${selected.name} expenses…` : `Message ${selected.name}…`}
                        disabled={mode === 'group' && !selected.conversationId}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); mode === 'group' ? sendGroup() : askAI() } }} />
                      <button type="button" className={styles.composerBtn} aria-label="Emoji" onClick={() => setEmojiOpen(!emojiOpen)}><Smile size={19} /></button>
                      {draft.trim()
                        ? <button type="submit" className={styles.sendBtn} disabled={streaming} aria-label={mode === 'ai' ? 'Ask' : 'Send'}><SendHorizonal size={18} /></button>
                        : <button type="button" className={styles.composerBtn} aria-label="Voice message (not available)" onClick={() => notify('Voice messages are not available yet')}><Mic size={19} /></button>}
                    </form>
                    {mode === 'group' && !selected.conversationId && <p className={styles.composerHint}><span>This group has no conversation yet.</span></p>}
                    <div className={styles.composerHint}><span><kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line</span><span>{mode === 'ai' ? 'AI can make mistakes — verify amounts' : selected.name}</span></div>
                  </div>
                </div>
              </>
            )}
          </section>

          {details && selected && (
            <aside className={styles.details} aria-label="Conversation details">
              <div className={styles.detailsHead}>
                <button className={`${styles.iconBtn} ${styles.detailsClose}`} onClick={() => setDetails(false)} aria-label="Close details"><X size={17} /></button>
                <span className={styles.convIcon}><GroupIcon size={24} /></span>
                <h2>{selected.name}</h2>
                <p>{selected.memberIds.length} members · {expenseCount} expenses</p>
                <span className={styles.memberFaces}>{memberUsers.slice(0, 5).map((u) => <Avatar key={u.id} user={u} size={26} />)}</span>
              </div>
              <div className={styles.detailsActions}>
                <button className={styles.actionTile} onClick={() => notify('Calls are not available in chat yet')}><Phone size={19} />Call</button>
                <button className={styles.actionTile} onClick={() => notify('Calls are not available in chat yet')}><Video size={19} />Video</button>
                <button className={`${styles.actionTile} ${muted[selected.id] ? styles.actionTileOn : ''}`} onClick={() => { setMuted((p) => ({ ...p, [selected.id]: !p[selected.id] })); notify(muted[selected.id] ? 'Notifications on for this group' : 'Conversation muted (this device only)') }}>{muted[selected.id] ? <BellOff size={19} /> : <Bell size={19} />}{muted[selected.id] ? 'Muted' : 'Mute'}</button>
                <button className={styles.actionTile} onClick={() => notify('Search in conversation is not available yet')}><Search size={19} />Search</button>
              </div>

              <section className={styles.detailsSec}><h3>Balances with members</h3>
                {detailDebts.length > 0 || myBalance !== 0 ? <>
                  <div className={styles.balanceHero}>
                    <p className="tabular" style={{ fontSize: 22, fontWeight: 600, color: myBalance > 0 ? 'var(--owed)' : myBalance < 0 ? 'var(--owe)' : 'var(--text)' }}>{myBalance !== 0 ? money(myBalance) : 'Settled'}</p>
                    <p>{myBalance > 0 ? `You’re owed ${money(myBalance)}` : myBalance < 0 ? `You owe ${money(myBalance)}` : 'You’re all settled up'}{balanceKnown ? ` · ${money(totalSpent)} spent in this group` : ' · across your recent groups'}</p>
                  </div>
                  {detailDebts.length === 0 && <p className={styles.detailsEmpty}>No open balances with members of this group.</p>}
                  {detailDebts.map((d) => (
                    <div className={styles.debtRow} key={d.user.id}><Avatar user={d.user} size={30} />
                      <span className={styles.grow}><strong>{d.user.name}</strong><small>{d.amount > 0 ? 'owes you' : 'you owe'}</small></span>
                      <span className={`${styles.debtAmt} ${d.amount > 0 ? styles.owedText : styles.oweText}`}>{money(d.amount)}</span>
                      {d.amount > 0
                        ? <Button size="sm" onClick={() => notify(`Reminder noted for ${firstName(d.user.name)} — not sent from chat yet`)}>Remind</Button>
                        : <Button size="sm" variant="primary" onClick={() => notify('Settlements are recorded from the group page')}>Settle</Button>}
                    </div>
                  ))}
                </> : <p className={styles.detailsEmpty}>No open balances with members of this group.</p>}
              </section>

              <section className={styles.detailsSec}><h3>Members · {memberUsers.length}</h3>
                {memberUsers.map((u) => (
                  <button className={styles.memberRow} key={u.id} onClick={() => navigate(`/users/${u.id}`)}>
                    <Avatar user={u} size={30} /><span className={styles.grow}><strong>{u.name}{u.id === me.id && <> <span className={styles.roleBadge}>You</span></>}</strong><small>{u.email}</small></span>
                  </button>
                ))}
              </section>

              <section className={styles.detailsSec}><h3>Recent expenses</h3>
                {expenses.length === 0 ? <p className={styles.detailsEmpty}>{expensesNote || 'No expenses yet — add one from the composer.'}</p> : <>
                  {expenses.slice(0, 5).map((e) => {
                    const Icon = categoryIcon[(e.category as keyof typeof categoryIcon)] ?? ReceiptText
                    return (
                      <div className={styles.expenseRow} key={e.id}><span className={styles.mcIcon}><Icon size={16} /></span>
                        <span className={styles.expenseMain}><strong>{e.title}</strong><small>{firstName(e.paidBy.name)} · {relativeDay(e.date, new Date())}</small></span>
                        <span className={styles.expenseAmt}>{money(e.amount)}</span></div>
                    )
                  })}
                  <Button size="sm" onClick={() => navigate(`/groups/${selected.id}`)}><FileText size={14} /> View group</Button>
                </>}
              </section>

              <section className={styles.detailsSec} style={{ borderBottom: 0 }}>
                <button className={styles.linkRow} onClick={() => setAddingExpense(true)}><ReceiptText size={16} /> Add expense</button>
                <button className={styles.linkRow} onClick={() => navigate(`/groups/${selected.id}`)}><HandCoins size={16} /> Open group page</button>
                <button className={styles.linkRow} onClick={() => notify('Chat history download is not available yet')}><Download size={16} /> Download chat history</button>
                <button className={`${styles.linkRow} ${styles.linkDanger}`} onClick={() => notify('Leaving a group is done from the group page')}><Trash2 size={16} /> Leave group</button>
              </section>
            </aside>
          )}
        </div>
      </main>
      <MobileNav onAdd={() => setAddingExpense(true)} />
      {addingExpense && (
        <AddExpenseModal open={addingExpense} onClose={() => setAddingExpense(false)}
          onSave={(expense, group) => { setAddingExpense(false); notify(`Added “${expense.title}” to ${group.name}`) }}
          groups={groups} users={users} me={me.id} today={new Date()} />
      )}
      <Toast message={toast} />
    </div>
  )
}

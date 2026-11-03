import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { MessageSquare, Send, Sparkles } from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { iconForKind } from '../lib/GroupKinds'
import type { Group, User } from '../types'
import dashStyles from './Dashboard.module.css'
import styles from './Chat.module.css'

interface ApiGroup { _id: string; name: string; kind: string; conversationId?: string; members: { userId: { _id: string; username: string; email: string } }[] }
interface Msg { id: string; senderId: string; senderName: string; content: string; createdAt: string; ai?: boolean }
type Mode = 'group' | 'ai'

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
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const selected = groups.find((g) => g.id === selectedId) ?? null
  const thread = mode === 'group' ? messages : aiMessages

  useEffect(() => {
    async function load() {
      try {
        const [groupsRes, profileRes] = await Promise.all([fetch('/api/groups/me'), fetch('/api/my-profile')])
        if (groupsRes.status === 401 || profileRes.status === 401) { navigate('/login'); return }
        const profile = profileRes.ok ? await profileRes.json() : null
        if (profile?.user) setMe(profile.user)
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
    })
    return () => { socket.disconnect(); socketRef.current = null }
  }, [me?.id, selected?.conversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.length, mode])

  async function sendGroup() {
    const content = draft.trim()
    if (!content || !selected?.conversationId) return
    setDraft('')
    const res = await fetch(`/api/conversations/${selected.conversationId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
    })
    if (!res.ok) { setDraft(content); return }
    const m = await res.json()
    setMessages((prev) => prev.some((x) => x.id === m._id) ? prev : [...prev, { id: m._id, senderId: me!.id, senderName: me!.name, content: m.content, createdAt: m.createdAt }])
  }

  async function askAI() {
    const question = draft.trim()
    if (!question || !selected || streaming) return
    setDraft(''); setStreaming(true)
    const aiId = `ai-${Date.now()}`
    setAiMessages((p) => [...p,
      { id: `q-${Date.now()}`, senderId: me!.id, senderName: me!.name, content: question, createdAt: new Date().toISOString() },
      { id: aiId, senderId: 'ai', senderName: 'Tally AI', content: '', createdAt: new Date().toISOString(), ai: true }])
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

  if (loading || !me) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>{error ?? 'Loading…'}</div>

  return (
    <div className={dashStyles.app}>
      <Sidebar me={me} />
      <main className={`${dashStyles.main} ${styles.chatMain}`}>
        <div className={styles.layout}>
          <aside className={styles.list} aria-label="Conversations">
            <h1 className={styles.listTitle}>Chat</h1>
            {groups.length === 0 && <p className={styles.empty}>Join a group to start chatting.</p>}
            {groups.map((g) => {
              const Icon = iconForKind(g.kind)
              return (
                <div key={g.id}>
                  <button className={`${styles.conv} ${selectedId === g.id && mode === 'group' ? styles.convOn : ''}`} onClick={() => { setSelectedId(g.id); setMode('group') }}>
                    <span className={styles.convIcon}><Icon size={17} /></span>
                    <span className={styles.convText}><strong>{g.name}</strong><small>{g.memberIds.length} people</small></span>
                  </button>
                  <button className={`${styles.conv} ${selectedId === g.id && mode === 'ai' ? styles.convOn : ''}`} onClick={() => { setSelectedId(g.id); setMode('ai') }}>
                    <span className={`${styles.convIcon} ${styles.aiIcon}`}><Sparkles size={16} /></span>
                    <span className={styles.convText}><strong>AI — {g.name}</strong><small>Ask about this group</small></span>
                  </button>
                </div>
              )
            })}
          </aside>

          <section className={styles.thread} aria-label="Conversation">
            {!selected ? <p className={styles.empty}>Select a conversation.</p> : (
              <>
                <div className={styles.modeToggle} role="tablist" aria-label="Chat mode">
                  <button role="tab" aria-selected={mode === 'group'} className={mode === 'group' ? styles.modeOn : ''} onClick={() => setMode('group')}><MessageSquare size={15} /> Group chat</button>
                  <button role="tab" aria-selected={mode === 'ai'} className={mode === 'ai' ? styles.modeOn : ''} onClick={() => setMode('ai')}><Sparkles size={15} /> Ask AI</button>
                </div>
                <h2 className={styles.threadTitle}>{mode === 'ai' ? `Ask AI about ${selected.name}` : selected.name}</h2>
                <div className={styles.msgs}>
                  {thread.length === 0 && <p className={styles.empty}>{mode === 'ai' ? 'Ask anything about this group’s expenses.' : 'No messages yet — say hello.'}</p>}
                  {thread.map((m) => {
                    const mine = m.senderId === me.id
                    const sender = users[m.senderId] ?? { id: m.senderId, name: m.senderName, email: '' }
                    return (
                      <div key={m.id} className={`${styles.msg} ${mine ? styles.mine : ''}`}>
                        {m.ai ? <span className={`${styles.avatarAi}`}><Sparkles size={15} /></span> : <Avatar user={sender} size={32} />}
                        <div className={styles.bubble}><small>{mine ? 'You' : m.senderName}</small>{m.content || '…'}</div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>
                <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); mode === 'group' ? sendGroup() : askAI() }}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={mode === 'ai' ? `Ask about ${selected.name} expenses…` : `Message ${selected.name}…`} aria-label="Message" disabled={mode === 'group' && !selected.conversationId} />
                  <button type="submit" className={styles.send} disabled={!draft.trim() || streaming} aria-label={mode === 'ai' ? 'Ask' : 'Send'}><Send size={17} /></button>
                </form>
                {mode === 'group' && !selected.conversationId && <p className={styles.empty}>This group has no conversation yet.</p>}
              </>
            )}
          </section>
        </div>
      </main>
      <MobileNav onAdd={() => navigate('/dashboard')} />
    </div>
  )
}

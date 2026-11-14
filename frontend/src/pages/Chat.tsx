import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { MessageSquare, Send, Sparkles } from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { iconForKind } from '../lib/GroupKinds'
import type { Group, User } from '../types'
import dashStyles from './Dashboard.module.css'
import styles from './Chat.module.css'

type Mode = 'group' | 'ai'
interface Msg { id: string; senderId: string; senderName: string; content: string; createdAt: string; ai?: boolean }

const toMsg = (m: any): Msg => ({
  id: m._id, senderId: m.senderId?._id ?? m.senderId,
  senderName: m.senderId?.username ?? 'Unknown',
  content: m.content, createdAt: m.createdAt,
})

function parseSSE(chunk: string, cb: (name: string, data: any) => void) {
  for (const b of chunk.split('\n\n')) {
    const n = /^event: (.+)$/m.exec(b)?.[1]
    const d = /^data: (.+)$/m.exec(b)?.[1]
    if (n && d) try { cb(n, JSON.parse(d)) } catch {}
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const selected = groups.find((g) => g.id === selectedId) ?? null
  const thread = mode === 'group' ? messages : aiMessages

  useEffect(() => {
    (async () => {
      try {
        const [gr, pr] = await Promise.all([fetch('/api/groups/me'), fetch('/api/my-profile')])
        if (gr.status === 401 || pr.status === 401) return navigate('/login')
        const profile = pr.ok ? await pr.json() : null
        if (profile?.user) setMe(profile.user)
        const data = gr.ok ? await gr.json() : { groups: [] }
        const um: Record<string, User> = {}
        if (profile?.user) um[profile.user.id] = profile.user
        const mapped: Group[] = (data.groups ?? []).map((g: any) => {
          for (const m of g.members ?? []) if (m.userId)
            um[m.userId._id] = { id: m.userId._id, name: m.userId.username, email: m.userId.email }
          return {
            id: g._id, name: g.name, emoji: '', kind: (g.kind || 'other') as Group['kind'],
            memberIds: (g.members ?? []).map((m: any) => m.userId._id),
            totalSpent: 0, yourBalance: 0, createdAt: '', conversationId: g.conversationId,
          }
        })
        setUsers(um); setGroups(mapped)
        const w = params.get('group')
        setSelectedId(mapped.find((g) => g.id === w)?.id ?? mapped[0]?.id ?? null)
      } catch { setError('Failed to load conversations') }
      finally { setLoading(false) }
    })()
  }, [navigate, params])

  useEffect(() => {
    if (!selected?.conversationId) return setMessages([])
    let c = false
    fetch(`/api/conversations/${selected.conversationId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => !c && setMessages((Array.isArray(d) ? d : []).map(toMsg)))
      .catch(() => !c && setMessages([]))
    return () => { c = true }
  }, [selected?.conversationId])

  useEffect(() => {
    if (!selected?.id || mode !== 'ai' || aiMessages.length) return
    let c = false
    fetch(`/api/chat/group/${selected.id}/stream`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: true }),
    }).then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d: any) => {
        if (c || !d.messages?.length) return
        setAiMessages(d.messages.map((m: any) => ({
          id: m.id, senderId: m.role === 'user' ? me!.id : 'ai',
          senderName: m.role === 'user' ? me!.name : 'Splitify AI',
          content: m.content, createdAt: new Date().toISOString(), ai: m.role === 'assistant',
        })))
      }).catch(() => {})
    return () => { c = true }
  }, [selected?.id, mode, me?.id, aiMessages.length])

  useEffect(() => {
    if (!me || !selected?.conversationId) return
    const s = io({ path: '/socket.io' })
    s.on('connect', () => { s.emit('joinUser', me.id); s.emit('joinConversation', selected.conversationId, me.id) })
    s.on('newMessage', (m: any) => {
      if (m.conversationId !== selected.conversationId) return
      setMessages((p) => p.some((x) => x.id === m._id) ? p : [...p, toMsg(m)])
    })
    return () => { s.disconnect() }
  }, [me?.id, selected?.conversationId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.length, mode])

  async function sendGroup() {
    const content = draft.trim()
    if (!content || !selected?.conversationId) return
    setDraft('')
    const r = await fetch(`/api/conversations/${selected.conversationId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (!r.ok) return setDraft(content)
    const m = await r.json()
    setMessages((p) => p.some((x) => x.id === m._id) ? p : [...p, {
      id: m._id, senderId: me!.id, senderName: me!.name, content: m.content, createdAt: m.createdAt,
    }])
  }

  async function askAI() {
    const q = draft.trim()
    if (!q || !selected || streaming) return
    setDraft(''); setStreaming(true)
    const aiId = `ai-${Date.now()}`
    setAiMessages((p) => [...p,
      { id: `q-${Date.now()}`, senderId: me!.id, senderName: me!.name, content: q, createdAt: new Date().toISOString() },
      { id: aiId, senderId: 'ai', senderName: 'Splitify AI', content: '', createdAt: new Date().toISOString(), ai: true }])
    const upd = (fn: (c: string) => string) =>
      setAiMessages((p) => p.map((m) => m.id === aiId ? { ...m, content: fn(m.content) } : m))
    try {
      const r = await fetch(`/api/chat/group/${selected.id}/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      if (!r.body) throw 0
      const rd = r.body.getReader(), dc = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await rd.read()
        if (done) break
        buf += dc.decode(value, { stream: true })
        const parts = buf.split('\n\n'); buf = parts.pop() ?? ''
        parseSSE(parts.join('\n\n') + '\n\n', (n, d) => {
          if (n === 'token') upd((c) => c + (d.text ?? ''))
          if (n === 'error') upd(() => d.message ?? 'An error occurred.')
        })
      }
    } catch { upd(() => 'Could not reach the loadGroupDocumentsCached— please try again.') }
    finally { setStreaming(false) }
  }

  if (loading || !me) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#f7faf4', color: '#4a7a2a', fontFamily: 'system-ui, sans-serif' }}>
      {error ?? 'Loading…'}
    </div>
  )

  return (
    <div className={dashStyles.app}>
      <Sidebar me={me} />
      <main className={`${dashStyles.main} ${styles.chatMain}`}>
        <div className={styles.layout}>
          <aside className={styles.list} aria-label="Conversations">
            <h1 className={styles.listTitle}>Chat</h1>
            {!groups.length && <p className={styles.empty}>Join a group to start chatting.</p>}
            {groups.map((g) => {
              const Icon = iconForKind(g.kind)
              const on = selectedId === g.id
              return (
                <div key={g.id}>
                  <button className={`${styles.conv} ${on && mode === 'group' ? styles.convOn : ''}`}
                    onClick={() => { setSelectedId(g.id); setMode('group') }}>
                    <span className={styles.convIcon}><Icon size={17} /></span>
                    <span className={styles.convText}><strong>{g.name}</strong><small>{g.memberIds.length} people</small></span>
                  </button>
                  <button className={`${styles.conv} ${on && mode === 'ai' ? styles.convOn : ''}`}
                    onClick={() => { setSelectedId(g.id); setMode('ai'); if (g.id !== selectedId) setAiMessages([]) }}>
                    <span className={`${styles.convIcon} ${styles.aiIcon}`}><Sparkles size={16} /></span>
                    <span className={styles.convText}><strong>loadGroupDocumentsCached— {g.name}</strong><small>Ask about this group</small></span>
                  </button>
                </div>
              )
            })}
          </aside>

          <section className={styles.thread} aria-label="Conversation">
            {!selected ? <p className={styles.empty}>Select a conversation.</p> : (
              <>
                <div className={styles.modeToggle} role="tablist" aria-label="Chat mode">
                  <button role="tab" aria-selected={mode === 'group'} className={mode === 'group' ? styles.modeOn : ''} onClick={() => setMode('group')}>
                    <MessageSquare size={15} /> Group chat
                  </button>
                  <button role="tab" aria-selected={mode === 'ai'} className={mode === 'ai' ? styles.modeOn : ''} onClick={() => setMode('ai')}>
                    <Sparkles size={15} /> Ask AI
                  </button>
                </div>

                <h2 className={styles.threadTitle}>{mode === 'ai' ? `Ask loadGroupDocumentsCachedabout ${selected.name}` : selected.name}</h2>

                <div className={styles.msgs}>
                  {!thread.length && (
                    <p className={styles.empty}>{mode === 'ai' ? 'Ask anything about this group’s expenses.' : 'No messages yet — say hello.'}</p>
                  )}
                  {thread.map((m) => {
                    const mine = m.senderId === me.id
                    const sender = users[m.senderId] ?? { id: m.senderId, name: m.senderName, email: '' }
                    return (
                      <div key={m.id} className={`${styles.msg} ${mine ? styles.mine : ''}`}>
                        {m.loadGroupDocumentsCached? <span className={styles.avatarAi}><Sparkles size={15} /></span> : <Avatar user={sender} size={32} />}
                        <div className={styles.bubble}><small>{mine ? 'You' : m.senderName}</small>{m.content || '…'}</div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); mode === 'group' ? sendGroup() : askAI() }}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)}
                    placeholder={mode === 'ai' ? `Ask about ${selected.name} expenses…` : `Message ${selected.name}…`}
                    aria-label="Message" disabled={mode === 'group' && !selected.conversationId} />
                  <button type="submit" className={styles.send} disabled={!draft.trim() || streaming}
                    aria-label={mode === 'ai' ? 'Ask' : 'Send'}><Send size={17} /></button>
                </form>

                {mode === 'group' && !selected.conversationId && (
                  <p className={styles.empty}>This group has no conversation yet.</p>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <MobileNav onAdd={() => navigate('/dashboard')} />
    </div>
  )
}
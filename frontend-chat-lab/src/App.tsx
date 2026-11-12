import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive, ArrowLeft, Bell, BellOff, Check, CheckCheck, ChevronDown, CirclePlus, Copy, Download, Eraser,
  FileText, HandCoins, Hash, Heart, Image as ImageIcon, LayoutGrid, MessageSquare, Mic, Moon, MoreVertical,
  Paperclip, Phone, Pin, Plus, ReceiptText, Reply, Search, SendHorizonal, Settings, Smile, Sparkles, Split,
  Sun, Trash2, UsersRound, Video, Wallet, X,
} from 'lucide-react'
import { AI_ANSWERS, AI_SUGGESTIONS, CONVERSATIONS, ME, MESSAGES, PEOPLE, QUICK_EMOJI, initials, money, type Conv, type Msg } from './data'

type Mode = 'group' | 'ai'
type Filter = 'all' | 'unread' | 'groups' | 'settled'

const fmtBalance = (c: Conv) => c.balance > 0 ? `You're owed ${money(c.balance)}` : c.balance < 0 ? `You owe ${money(c.balance)}` : 'All settled up'

function Avatar({ id, size = 40, presence = false }: { id: string; size?: number; presence?: boolean }) {
  const p = PEOPLE[id] ?? ME
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: p.gradient }} aria-hidden>
      {id === 'ai' ? <Sparkles size={size * 0.48} /> : initials(p.name)}
      {presence && <span className={`presence ${p.presence}`} />}
    </span>
  )
}

function Rail({ theme, onTheme, onToast }: { theme: string; onTheme: () => void; onToast: (t: string) => void }) {
  const [active, setActive] = useState('chat')
  const items = [
    { id: 'dash', icon: LayoutGrid, label: 'Dashboard', badge: 0 },
    { id: 'groups', icon: UsersRound, label: 'Groups & friends', badge: 0 },
    { id: 'chat', icon: MessageSquare, label: 'Chat', badge: 4 },
    { id: 'wallet', icon: Wallet, label: 'Balances', badge: 0 },
    { id: 'bell', icon: Bell, label: 'Notifications', badge: 7 },
    { id: 'settings', icon: Settings, label: 'Settings', badge: 0 },
  ]
  return (
    <nav className="rail" aria-label="Splitify">
      <span className="rail-logo"><Split size={18} strokeWidth={2.4} /></span>
      {items.slice(0, 3).map((i) => (
        <button key={i.id} className={`rail-btn ${active === i.id ? 'on' : ''}`} aria-label={i.label} title={i.label}
          onClick={() => { setActive(i.id); if (i.id !== 'chat') onToast(`${i.label} — prototype focuses on Chat`) }}>
          <i.icon size={18} strokeWidth={1.9} />{i.badge > 0 && <span className="dot">{i.badge}</span>}
        </button>
      ))}
      <span className="rail-spacer" />
      {items.slice(3).map((i) => (
        <button key={i.id} className={`rail-btn ${active === i.id ? 'on' : ''}`} aria-label={i.label} title={i.label} onClick={() => { setActive(i.id); onToast(`${i.label} — prototype focuses on Chat`) }}>
          <i.icon size={18} strokeWidth={1.9} />{i.badge > 0 && <span className="dot">{i.badge}</span>}
        </button>
      ))}
      <button className="rail-btn" onClick={onTheme} aria-label="Toggle theme" title="Toggle theme">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      <button className="rail-avatar" onClick={() => onToast('Profile — Zack El Amrani')} aria-label="Your profile"><Avatar id="me" size={34} presence /></button>
    </nav>
  )
}

function ConvList({ convs, selected, onSelect, query, setQuery, filter, setFilter, onToast, typingFor }: {
  convs: Conv[]; selected: string; onSelect: (id: string) => void; query: string; setQuery: (v: string) => void;
  filter: Filter; setFilter: (f: Filter) => void; onToast: (t: string) => void; typingFor: string | null
}) {
  const visible = convs.filter((c) =>
    (filter === 'all' || (filter === 'unread' && c.unread > 0) || (filter === 'groups' && !c.archived) || (filter === 'settled' && c.balance === 0)) &&
    c.name.toLowerCase().includes(query.trim().toLowerCase()))
  const pinned = visible.filter((c) => c.pinned); const rest = visible.filter((c) => !c.pinned)
  const row = (c: Conv) => (
    <button key={c.id} className={`conv ${c.id === selected ? 'on' : ''} ${c.unread ? 'unread' : ''}`} onClick={() => onSelect(c.id)} aria-current={c.id === selected}>
      <span className="conv-icon" aria-hidden>{c.icon}</span>
      <span className="conv-body">
        <span className="conv-top"><span className="conv-name">{c.name}</span><span className={`conv-time ${c.unread ? 'hot' : ''}`}>{c.last.time}</span></span>
        <span className="conv-last">
          {typingFor === c.id
            ? <><span className="typing-dots"><i /><i /><i /></span><span style={{ color: 'var(--brand)', fontWeight: 600 }}>Salma is typing…</span></>
            : <span>{c.last.from}: {c.last.text}</span>}
          {c.muted && <BellOff size={13} style={{ flex: 'none', color: 'var(--text-3)' }} />}
          {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
        </span>
        <span className="conv-meta">
          <span className="pill settled">{c.activity.split('·')[0]}</span>
        </span>
      </span>
    </button>
  )
  return (
    <aside className="list-pane" aria-label="Conversations">
      <div className="list-head">
        <div className="list-title"><h1>Messages</h1>
          <button className="icon-btn primary" aria-label="New conversation" onClick={() => onToast('New conversation — pick a group or friend')}><CirclePlus size={19} /></button></div>
        <label className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations…" aria-label="Search conversations" /><kbd>⌘K</kbd></label>
      </div>
      <div className="filters" role="tablist" aria-label="Filter conversations">
        {([['all', 'All'], ['unread', 'Unread'], ['groups', 'Groups'], ['settled', 'Settled']] as [Filter, string][]).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={filter === id} className={`chip ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>
            {label}{id === 'unread' && <span className="count">{convs.reduce((a, c) => a + c.unread, 0)}</span>}
          </button>
        ))}
      </div>
      <div className="list-scroll">
        {visible.length === 0 && <div className="empty-list"><strong>No conversations found</strong>Try another search, or start a new group.</div>}
        {pinned.length > 0 && <><p className="list-label">📌 Pinned</p>{pinned.map(row)}</>}
        {rest.length > 0 && <><p className="list-label">All conversations</p>{rest.map(row)}</>}
      </div>
    </aside>
  )
}

function MoneyCard({ m, onToast }: { m: Msg; onToast: (t: string) => void }) {
  const e = m.expense!; const settle = m.kind === 'settlement'
  return (
    <div className="money-card">
      <div className="mc-head"><span className={`mc-icon ${settle ? 'settle' : ''}`}>{settle ? <HandCoins size={18} /> : <ReceiptText size={18} />}</span>
        <span><span className="mc-title">{e.title}</span><span className="mc-sub" style={{ display: 'block' }}>{settle ? 'Settlement recorded' : `Paid by ${e.paidBy} · ${e.category}`}</span></span></div>
      <div className="mc-amount"><strong>{money(e.amount)}</strong><span>{settle ? '· completed' : `· your share ${money(e.yourShare)}`}</span></div>
      <div className="mc-foot">
        {settle || e.settled
          ? <span className="pill owed"><Check size={13} /> Settled</span>
          : <><button className="btn brand sm" onClick={() => onToast(`Settled your ${money(e.yourShare)} share`)}>Settle {money(e.yourShare)}</button>
            <button className="btn sm" onClick={() => onToast('Expense details — split breakdown, receipt & history')}>Details</button></>}
      </div>
    </div>
  )
}

function Bubble({ m, grouped, onReply, onReact, onPin, onToast }: {
  m: Msg; grouped: boolean; onReply: (m: Msg) => void; onReact: (m: Msg) => void; onPin: (m: Msg) => void; onToast: (t: string) => void
}) {
  const sender = PEOPLE[m.senderId] ?? ME
  const isMoney = m.kind === 'expense' || m.kind === 'settlement'
  return (
    <div className={`msg-row ${m.mine ? 'mine' : ''} ${grouped ? 'grouped' : ''} ${m.kind === 'ai' ? 'ai-row' : ''}`}>
      <span className="avatar-slot">{!grouped && !m.mine && <Avatar id={m.senderId} size={30} presence />}</span>
      <div className="bubble-wrap">
        {isMoney ? <MoneyCard m={m} onToast={onToast} /> : (
          <div className="bubble">
            {m.kind === 'ai' && <span className="ai-tag"><Sparkles size={11} /> Splitify AI</span>}
            {!grouped && !m.mine && m.kind !== 'ai' && <span className="who">{sender.name}</span>}
            {m.replyTo && <span className="reply-quote"><b>{m.replyTo.name}</b>{m.replyTo.text}</span>}
            {m.text}{m.text === '' && m.kind !== 'ai' ? '' : null}
            <span className="meta">{m.time}{m.edited ? ' · edited' : ''}{m.mine && (m.status === 'read' ? <CheckCheck size={13} /> : <Check size={13} />)}</span>
          </div>
        )}
        {m.reactions && m.reactions.length > 0 && (
          <div className="reactions">{m.reactions.map((r) => (
            <button key={r.emoji} className={`reaction ${r.by.includes('You') ? 'mine-r' : ''}`} title={r.by.join(', ')} onClick={() => onReact(m)}>{r.emoji} {r.by.length}</button>
          ))}</div>
        )}
      </div>
      <span className="msg-actions">
        <button className="mini-btn" aria-label="React" onClick={() => onReact(m)}><Smile size={15} /></button>
        <button className="mini-btn" aria-label="Reply" onClick={() => onReply(m)}><Reply size={15} /></button>
        <button className="mini-btn" aria-label={m.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(m)}><Pin size={15} /></button>
      </span>
    </div>
  )
}

function Details({ conv, onClose, onToast }: { conv: Conv; onClose: () => void; onToast: (t: string) => void }) {
  const [muted, setMuted] = useState(!!conv.muted)
  const members = conv.members.map((id) => PEOPLE[id]).filter(Boolean)
  const debts = [
    { id: 'salma', name: 'Salma Idrissi', note: 'owes you', amt: 260 },
    { id: 'yassine', name: 'Yassine Bennis', note: 'you owe', amt: -84 },
    { id: 'lina', name: 'Lina Mansouri', note: 'settled', amt: 0 },
  ]
  const actions = [
    { icon: Phone, label: 'Call', fn: () => onToast('Voice call — coming in the full app') },
    { icon: Video, label: 'Video', fn: () => onToast('Video call — coming in the full app') },
    { icon: muted ? Bell : BellOff, label: muted ? 'Muted' : 'Mute', on: muted, fn: () => { setMuted(!muted); onToast(muted ? 'Notifications on' : 'Conversation muted') } },
    { icon: Search, label: 'Search', fn: () => onToast('Search in conversation — try the list search') },
  ]
  return (
    <aside className="details-pane" aria-label="Conversation details">
      <div className="details-head">
        <button className="icon-btn details-close" onClick={onClose} aria-label="Close details"><X size={17} /></button>
        <span className="conv-icon" aria-hidden>{conv.icon}</span><h2>{conv.name}</h2>
        <p>{conv.kind} · {members.length + 1} members · {conv.activity}</p>
        <div className="member-faces">{['me', ...conv.members].map((id) => <Avatar key={id} id={id} size={26} />)}</div>
      </div>
      <div className="details-actions">{actions.map((a) => (
        <button key={a.label} className={`action-tile ${a.on ? 'on' : ''}`} onClick={a.fn}><a.icon size={19} />{a.label}</button>))}</div>

      <section className="details-sec"><h3>Group balance</h3>
        <div className={`balance-hero ${conv.balance > 0 ? '' : conv.balance < 0 ? 'owe' : 'settled'}`}>
          <p className="amount" style={{ color: conv.balance > 0 ? 'var(--owed)' : conv.balance < 0 ? 'var(--owe)' : 'var(--text)' }}>{conv.balance !== 0 ? money(conv.balance) : '✓'}</p>
          <p>{fmtBalance(conv)} · {money(conv.totalSpent)} total spent</p>
        </div>
        {debts.map((d) => (
          <div className="debt-row" key={d.id}><Avatar id={d.id} size={29} />
            <span className="grow"><strong>{d.name}</strong><small>{d.note}</small></span>
            <span className={`debt-amt ${d.amt > 0 ? 'owed' : d.amt < 0 ? 'owe' : ''}`}>{d.amt !== 0 ? money(d.amt) : '—'}</span>
            {d.amt > 0 && <button className="btn sm" onClick={() => onToast(`Reminder sent to ${d.name}`)}>Remind</button>}
            {d.amt < 0 && <button className="btn brand sm" onClick={() => onToast(`Settled ${money(d.amt)} with ${d.name}`)}>Settle</button>}
          </div>
        ))}
        <button className="btn" style={{ width: '100%', marginTop: 12 }} onClick={() => onToast('Settle up — Splitify suggests 3 payments to balance everyone')}><HandCoins size={16} /> Settle up</button>
      </section>

      <section className="details-sec"><h3>Members · {members.length + 1} <button onClick={() => onToast('Invite link copied to clipboard')}>+ Invite</button></h3>
        <button className="member-row" onClick={() => onToast('Your profile')}><Avatar id="me" size={30} presence /><span className="grow"><strong>You <span className="role-badge">Owner</span></strong><small>Active now</small></span></button>
        {members.map((p) => (
          <button className="member-row" key={p.id} onClick={() => onToast(`${p.name} — view profile & shared balance`)}>
            <Avatar id={p.id} size={30} presence /><span className="grow"><strong>{p.name}</strong><small>{p.presence === 'online' ? 'Active now' : p.presence === 'away' ? 'Away' : `Last seen ${p.lastSeen ?? ''}`}</small></span>
          </button>
        ))}
      </section>

      <section className="details-sec"><h3>Recent expenses</h3>
        {[['Train tickets · Casa → Tangier', 'Salma · Transport', 720], ['Riad · 2 nights deposit', 'Yassine · Lodging', 1200], ['Fuel + tolls', 'You · Transport', 340]].map(([t, s, a]) => (
          <div className="expense-row" key={t as string}><span className="mc-icon"><ReceiptText size={16} /></span><span className="expense-main"><strong>{t}</strong><small>{s}</small></span><strong className="expense-amt">{money(a as number)}</strong></div>
        ))}
        <button className="btn sm" style={{ marginTop: 10 }} onClick={() => onToast('All expenses — full ledger with filters')}><FileText size={14} /> View all expenses</button>
      </section>

      <section className="details-sec"><h3>Shared</h3>
        <div className="shared-grid">{['🖼️', '📎', '🔗', '🎵', '📍', '📄'].map((e, i) => <a key={i} href="#" onClick={(ev) => { ev.preventDefault(); onToast('Shared media — photos, files & links') }}>{e}</a>)}</div>
      </section>

      <section className="details-sec" style={{ borderBottom: 0 }}>
        {[{ label: 'Download chat history', Icon: Download, danger: false }, { label: 'Archive conversation', Icon: Archive, danger: false }, { label: 'Clear chat', Icon: Eraser, danger: false }, { label: 'Leave group', Icon: Trash2, danger: true }].map(({ label, Icon, danger }) => (
          <button key={label} className={`link-row ${danger ? 'danger' : ''}`} onClick={() => onToast(`${label} — confirm in the full app`)}><Icon size={16} />{label}</button>
        ))}
      </section>
    </aside>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const forced = new URLSearchParams(window.location.search).get('theme')
    if (forced === 'dark' || forced === 'light') return forced
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [convs, setConvs] = useState(CONVERSATIONS)
  const [selected, setSelected] = useState('chefchaouen')
  const [mode, setMode] = useState<Mode>('group')
  const [msgs, setMsgs] = useState<Record<string, Msg[]>>(MESSAGES)
  const [aiMsgs, setAiMsgs] = useState<Msg[]>([{ id: 'ai0', senderId: 'ai', kind: 'ai', text: 'Hi Zack — I know everything about Chefchaouen Trip: 12 expenses, 8,420 MAD spent, balances and who paid what. Ask me anything, or tap a suggestion below.', time: 'now' }])
  const [draft, setDraft] = useState(''); const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState<Filter>('all')
  const [details, setDetails] = useState(true); const [mobileThread, setMobileThread] = useState(false)
  const [toast, setToast] = useState<string | null>(null); const [emojiOpen, setEmojiOpen] = useState(false)
  const [typing, setTyping] = useState(false); const [aiTyping, setAiTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null); const inputRef = useRef<HTMLTextAreaElement>(null); const timer = useRef<number>()
  const conv = convs.find((c) => c.id === selected) ?? convs[0]
  const thread = mode === 'group' ? (msgs[conv.id] ?? []) : aiMsgs
  const pinnedMsg = useMemo(() => [...(msgs[conv.id] ?? [])].reverse().find((m) => m.pinned), [msgs, conv.id])

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [thread.length, mode, selected, typing, aiTyping])
  useEffect(() => { inputRef.current?.focus() }, [selected, mode])
  const notify = (t: string) => { setToast(t); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 2800) }
  const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  function selectConv(id: string) {
    setSelected(id); setMobileThread(true); setReplyTo(null)
    setConvs((p) => p.map((c) => c.id === id ? { ...c, unread: 0 } : c))
  }
  function send() {
    const text = draft.trim(); if (!text) return
    setDraft(''); setEmojiOpen(false)
    const m: Msg = { id: `u${Date.now()}`, senderId: 'me', text, time: now(), mine: true, status: 'sent', replyTo: replyTo ? { name: (PEOPLE[replyTo.senderId]?.name ?? 'You'), text: replyTo.text.slice(0, 80) } : undefined }
    setReplyTo(null)
    if (mode === 'ai') { askAI(text); return }
    setMsgs((p) => ({ ...p, [conv.id]: [...(p[conv.id] ?? []), m] }))
    setConvs((p) => p.map((c) => c.id === conv.id ? { ...c, last: { text, time: 'now', from: 'You' } } : c))
    window.setTimeout(() => setMsgs((p) => ({ ...p, [conv.id]: (p[conv.id] ?? []).map((x) => x.id === m.id ? { ...x, status: 'read' } : x) })), 1400)
    window.setTimeout(() => {
      setTyping(true)
      window.setTimeout(() => {
        setTyping(false)
        setMsgs((p) => ({ ...p, [conv.id]: [...(p[conv.id] ?? []), { id: `r${Date.now()}`, senderId: 'salma', text: 'Perfect — I’ll fold that into the plan and update the split. Anything else for the trip?', time: now() }] }))
      }, 1700)
    }, 900)
  }
  function askAI(q: string) {
    setAiMsgs((p) => [...p, { id: `q${Date.now()}`, senderId: 'me', text: q, time: now(), mine: true, status: 'read' }])
    setAiTyping(true)
    const key = q.toLowerCase().includes('owe') || q.toLowerCase().includes('who') ? 'who' : q.toLowerCase().includes('settle') ? 'settle' : q.toLowerCase().includes('spend') || q.toLowerCase().includes('transport') ? 'spend' : 'default'
    const answer = AI_ANSWERS[key]; const id = `a${Date.now()}`
    window.setTimeout(() => {
      setAiTyping(false); setAiMsgs((p) => [...p, { id, senderId: 'ai', kind: 'ai', text: '', time: now() }])
      let i = 0; const iv = window.setInterval(() => {
        i += 3; setAiMsgs((p) => p.map((x) => x.id === id ? { ...x, text: answer.slice(0, i) } : x))
        if (i >= answer.length) window.clearInterval(iv)
      }, 18)
    }, 800)
  }
  function react(m: Msg) {
    const apply = (list: Msg[]) => list.map((x) => x.id !== m.id ? x : { ...x, reactions: (x.reactions ?? []).some((r) => r.emoji === '🎉' && r.by.includes('You'))
      ? (x.reactions ?? []).map((r) => r.emoji === '🎉' ? { ...r, by: r.by.filter((b) => b !== 'You') } : r).filter((r) => r.by.length)
      : [...(x.reactions ?? []), { emoji: '🎉', by: ['You'] }] })
    if (mode === 'ai') setAiMsgs(apply); else setMsgs((p) => ({ ...p, [conv.id]: apply(p[conv.id] ?? []) }))
  }
  function pin(m: Msg) {
    setMsgs((p) => ({ ...p, [conv.id]: (p[conv.id] ?? []).map((x) => x.id === m.id ? { ...x, pinned: !x.pinned } : x) }))
    notify(m.pinned ? 'Message unpinned' : 'Message pinned to this conversation')
  }

  return (
    <div className={`app ${details ? 'details-open' : ''} ${mobileThread ? 'view-thread' : ''}`} data-theme={theme}>
      <Rail theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onToast={notify} />
      <ConvList convs={convs} selected={selected} onSelect={selectConv} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onToast={notify} typingFor={typing ? conv.id : null} />

      <main className="thread-pane" aria-label="Conversation">
        <header className="thread-head">
          <button className="icon-btn back-btn" onClick={() => setMobileThread(false)} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
          <button className="thread-id" onClick={() => setDetails(!details)} aria-label="Toggle group details">
            <span className="conv-icon" aria-hidden>{mode === 'ai' ? '✨' : conv.icon}</span>
            <span style={{ minWidth: 0 }}><span className="thread-name" style={{ display: 'block' }}>{mode === 'ai' ? `Ask AI · ${conv.name}` : conv.name}</span>
              <span className="thread-sub">{mode === 'ai' ? 'Knows expenses, balances & receipts' : <>{conv.members.length + 1} members · {conv.members.slice(0, 2).map((id) => PEOPLE[id].name.split(' ')[0]).join(', ')} & you · <span style={{ color: 'var(--owed)', fontWeight: 650 }}>3 online</span></>}</span></span>
          </button>
          <span className="member-faces">{conv.members.slice(0, 3).map((id) => <Avatar key={id} id={id} size={25} />)}</span>
          <div className="head-actions">
            <button className="icon-btn hide-mobile" aria-label="Voice call" onClick={() => notify('Voice call — coming in the full app')}><Phone size={17} /></button>
            <button className="icon-btn hide-mobile" aria-label="Video call" onClick={() => notify('Video call — coming in the full app')}><Video size={17} /></button>
            <button className="icon-btn" aria-label="Search in conversation" onClick={() => notify('Search in conversation — highlights matches')}><Search size={17} /></button>
            <button className="icon-btn" aria-label="Details" onClick={() => setDetails(!details)} aria-pressed={details}><MoreVertical size={17} /></button>
          </div>
        </header>

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="mode-switch" role="tablist" aria-label="Chat mode" style={{ position: 'sticky', top: 12, zIndex: 2 }}>
            <button role="tab" aria-selected={mode === 'group'} className={mode === 'group' ? 'on' : ''} onClick={() => setMode('group')}><MessageSquare size={15} /> Group chat</button>
            <button role="tab" aria-selected={mode === 'ai'} className={`ai ${mode === 'ai' ? 'on ai' : ''}`} onClick={() => setMode('ai')}><Sparkles size={15} /> Ask AI</button>
          </div>

          {mode === 'group' && (
            <div className={`balance-strip ${conv.balance > 0 ? '' : conv.balance < 0 ? 'owe' : 'settled'}`} role="status">
              <Wallet size={19} style={{ color: conv.balance > 0 ? 'var(--owed)' : conv.balance < 0 ? 'var(--owe)' : 'var(--text-3)', flex: 'none' }} />
              <span className="grow"><strong>{fmtBalance(conv)}</strong><p>{money(conv.totalSpent)} spent together · {conv.activity}</p></span>
              {conv.balance !== 0 && <button className="btn brand sm" onClick={() => notify(conv.balance > 0 ? 'Reminder sent to everyone who owes you' : `Settled ${money(conv.balance)}`)}>{conv.balance > 0 ? 'Remind' : 'Settle up'}</button>}
              <button className="btn sm" onClick={() => setDetails(true)}>Balances</button>
            </div>
          )}
          {mode === 'group' && pinnedMsg && (
            <div className="pinned-bar"><Pin size={14} style={{ flex: 'none' }} /><span><b>Pinned · </b>{pinnedMsg.text}</span>
              <button aria-label="Unpin" onClick={() => pin(pinnedMsg)}><X size={14} /></button></div>
          )}

          <div className="msgs" role="log" aria-label="Messages">
            {thread.map((m, i) => {
              const prev = thread[i - 1]
              const showDay = m.day && m.day !== prev?.day
              if (m.kind === 'system') return <div key={m.id}>{showDay && <div className="day-divider"><span>{m.day}</span></div>}<p className="system-msg">📌 {m.text} · {m.time}</p></div>
              const grouped = !!prev && prev.senderId === m.senderId && prev.kind !== 'system' && !showDay
              return <div key={m.id}>{showDay && <div className="day-divider"><span>{m.day}</span></div>}
                <Bubble m={m} grouped={grouped} onReply={(x) => { setReplyTo(x); inputRef.current?.focus() }} onReact={react} onPin={pin} onToast={notify} /></div>
            })}
            {thread.length === 0 && <p className="system-msg">No messages yet — say hello 👋</p>}
            <div ref={bottomRef} />
          </div>

          {mode === 'group' && typing && <div className="typing-row"><Avatar id="salma" size={24} /><span className="typing-dots"><i /><i /><i /></span> Salma is typing…</div>}
          {mode === 'ai' && aiTyping && <div className="typing-row"><Avatar id="ai" size={24} /><span className="typing-dots"><i /><i /><i /></span> Splitify AI is thinking…</div>}
          {mode === 'ai' && !aiTyping && (
            <div className="suggestions">{AI_SUGGESTIONS.map((s) => <button key={s} className="suggestion" onClick={() => askAI(s)}><Sparkles size={13} />{s}</button>)}</div>
          )}

          <div className="composer-zone">
            {replyTo && (
              <div className="reply-preview"><Reply size={15} style={{ color: 'var(--brand)', flex: 'none' }} /><span className="grow">Replying to <b>{PEOPLE[replyTo.senderId]?.name ?? 'You'}</b> · {replyTo.text}</span>
                <button className="mini-btn" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={14} /></button></div>
            )}
            {emojiOpen && <div className="emoji-pop" role="menu">{QUICK_EMOJI.map((e) => <button key={e} onClick={() => { setDraft((d) => d + e); inputRef.current?.focus() }}>{e}</button>)}</div>}
            <form className="composer" onSubmit={(e) => { e.preventDefault(); send() }}>
              <button type="button" className="composer-btn" aria-label="Attach" onClick={() => notify('Attach — photos, receipts, files & location')}><Paperclip size={19} /></button>
              <button type="button" className="composer-btn hide-mobile" aria-label="Add expense" onClick={() => notify('Add expense — amount, split & receipt, right from chat')}><ReceiptText size={19} /></button>
              <textarea ref={inputRef} value={draft} rows={1} aria-label="Message"
                placeholder={mode === 'ai' ? `Ask about ${conv.name} expenses…` : `Message ${conv.name}…  (try “/expense taxi 240”)`}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
              <button type="button" className="composer-btn" aria-label="Emoji" onClick={() => setEmojiOpen(!emojiOpen)}><Smile size={19} /></button>
              {draft.trim()
                ? <button type="submit" className="send-btn" aria-label={mode === 'ai' ? 'Ask AI' : 'Send message'}><SendHorizonal size={18} /></button>
                : <button type="button" className="composer-btn" aria-label="Voice message" onClick={() => notify('Voice message — hold to record in the full app')}><Mic size={19} /></button>}
            </form>
            <div className="composer-hint"><span><kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line · <b>/expense</b> to split a bill</span><span>{mode === 'ai' ? 'AI can make mistakes — verify amounts' : `${conv.name} · end-to-end encrypted`}</span></div>
          </div>
        </div>
      </main>

      {details && <Details conv={conv} onClose={() => setDetails(false)} onToast={notify} />}

      <nav className="mobile-nav" aria-label="Main">
        {[['Dashboard', LayoutGrid], ['Groups', UsersRound], ['', Plus], ['Chat', MessageSquare], ['Settings', Settings]].map(([label, Icon], i) => (
          label === '' ? <button key={i} className="fab" aria-label="Add expense" onClick={() => notify('Add expense')}><Icon size={23} /></button>
            : <button key={i} className={label === 'Chat' ? 'on' : ''} onClick={() => label !== 'Chat' && notify(`${label} — prototype focuses on Chat`)}><Icon size={19} />{label as string}</button>
        ))}
      </nav>
      <div className="lab-banner">🧪 <span><b>Splitify Chat — Design Lab</b> · prototype only · production app untouched</span></div>
      <div className="toast-zone" aria-live="polite">{toast && <div className="toast"><CheckCheck size={16} />{toast}</div>}</div>
    </div>
  )
}

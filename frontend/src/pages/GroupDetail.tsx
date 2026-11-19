import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Crown, LogOut, MessageSquare, Trash2, UserPlus } from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { AddMembersModal } from '../components/groups/AddMembersModal'
import { SettleUpModal } from '../components/groups/SettleUpModal'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { iconForKind } from '../lib/GroupKinds'
import { categoryIcon } from '../lib/categories'
import { money, relativeDay } from '../lib/format'
import type { Category, User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './Profile.module.css'

interface GroupExpense {
  id: string; title: string; category: Category; amount: number
  paidBy: User; date: string; myShare: number | null
}

interface GroupMember { user: User; role: string; joinedAt: string }
interface GroupBalances {
  myBalance: number
  totalSpent: number
  youOwe: { user: User; amount: number }[]
  oweYou: { user: User; amount: number }[]
}
interface GroupDetail {
  id: string; name: string; kind: string; description: string
  createdBy: User; createdAt: string; conversationId?: string; members: GroupMember[]
}

function mapUser(raw: any): User {
  return { id: String(raw?._id ?? raw?.id ?? ''), name: raw?.username ?? raw?.name ?? 'Unknown', email: raw?.email ?? '', avatar: raw?.avatar ?? null }
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [me, setMe] = useState<User | null>(null)
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [expensesNote, setExpensesNote] = useState('')
  const [friends, setFriends] = useState<User[]>([])
  const [adding, setAdding] = useState(false)
  const [settling, setSettling] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [balances, setBalances] = useState<GroupBalances | null>(null)
  const [notice, setNotice] = useState('')
  const [memberActionMessage, setMemberActionMessage] = useState('')
  const [memberActionError, setMemberActionError] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function loadExpenses() {
      try {
        // Canonical list endpoint. Until the backend serves it, show an empty state.
        const res = await fetch(`/api/groups/${groupId}/expenses`)
        if (cancelled) return
        if (res.status === 401) { navigate('/login'); return }
        if (!res.ok) { setExpenses([]); setExpensesNote('Expenses are not available for this group yet.'); return }
        const data = await res.json()
        const rows = (Array.isArray(data) ? data : data.expenses ?? []) as any[]
        setExpenses(rows.map((e): GroupExpense => ({
          id: String(e._id ?? e.id ?? `${e.description}-${e.date}`),
          title: e.description ?? e.title ?? 'Expense',
          category: (e.category ?? 'other') as Category,
          amount: Number(e.amount ?? 0),
          paidBy: mapUser(e.payer ?? e.paidBy),
          date: e.date ?? e.createdAt ?? new Date().toISOString(),
          myShare: e.myShare != null ? Number(e.myShare) : null,
        })).sort((a, b) => +new Date(b.date) - +new Date(a.date)))
      } catch {
        if (!cancelled) { setExpenses([]); setExpensesNote('Expenses are not available for this group yet.') }
      }
    }
    loadExpenses()
    return () => { cancelled = true }
  }, [groupId, navigate])

  async function loadBalances() {
    try {
      const res = await fetch(`/api/groups/${groupId}/balances`)
      if (!res.ok) return
      const data = await res.json()
      setBalances({
        myBalance: Number(data.myBalance ?? 0),
        totalSpent: Number(data.totalSpent ?? 0),
        youOwe: (data.youOwe ?? []).map((d: any) => ({ user: mapUser(d.user), amount: Number(d.amount ?? 0) })),
        oweYou: (data.oweYou ?? []).map((d: any) => ({ user: mapUser(d.user), amount: Number(d.amount ?? 0) })),
      })
    } catch { /* the section falls back to the expense totals */ }
  }

  useEffect(() => { loadBalances() }, [groupId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, groupRes] = await Promise.all([
          fetch('/api/my-profile'), fetch(`/api/groups/${groupId}`),
        ])
        if (profileRes.status === 401 || groupRes.status === 401) { navigate('/login'); return }
        if (groupRes.status === 404) { setError('This group could not be found.'); return }
        if (groupRes.status === 403) { setError('You are not a member of this group.'); return }
        if (!groupRes.ok) throw new Error('Could not load this group.')
        const profile = profileRes.ok ? await profileRes.json() : null
        if (profile?.user) setMe(profile.user)
        fetch('/api/friends')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => { if (d?.friends) setFriends(d.friends.map((f: any) => ({ id: f._id, name: f.username, email: f.email, avatar: f.avatar ?? null }))) })
          .catch(() => { /* picker stays empty; error surfaces on open */ })
        const data = await groupRes.json()
        const g = data.group
        setGroup({
          id: String(g._id ?? g.id),
          name: g.name,
          kind: g.kind ?? 'other',
          description: g.description ?? '',
          createdBy: mapUser(g.createdBy),
          createdAt: g.createdAt,
          conversationId: g.conversationId ?? undefined,
          members: (g.members ?? []).map((m: any) => ({ user: mapUser(m.userId), role: m.role, joinedAt: m.joinedAt })),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load this group.')
      }
    }
    load()
  }, [groupId, navigate])

  if (error) {
    return (
      <div className={styles.state} role="alert">
        <p>{error}</p>
        <Link to="/groups">Back to Groups &amp; Friends</Link>
      </div>
    )
  }
  if (!me || !group) return <div className={styles.state}>Loading group…</div>

  const currentUser = me
  const currentGroup = group
  const Icon = iconForKind(currentGroup.kind)
  const created = new Date(currentGroup.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const isOwner = currentGroup.members.some((m) => m.user.id === currentUser.id && m.role === 'owner')

  async function removeMember(user: User) {
    if (user.id === currentUser.id || !isOwner) return
    if (!window.confirm(`Remove ${user.name} from ${currentGroup.name}?`)) return

    setRemovingMemberId(user.id)
    setMemberActionMessage('')
    setMemberActionError('')
    try {
      const res = await fetch(`/api/groups/${currentGroup.id}/members/${user.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not remove this member.')

      setGroup((current) => current ? {
        ...current,
        members: current.members.filter((member) => member.user.id !== user.id),
      } : current)
      setMemberActionMessage(`${user.name} was removed from the group.`)
      loadBalances()
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Could not remove this member.')
    } finally {
      setRemovingMemberId(null)
    }
  }

  async function leaveGroup() {
    if (isOwner) return
    if (!window.confirm(`Leave ${currentGroup.name}? You will lose access to this group.`)) return

    setLeaving(true)
    setMemberActionMessage('')
    setMemberActionError('')
    try {
      const res = await fetch(`/api/groups/${currentGroup.id}/leave`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not leave this group.')
      navigate('/groups')
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Could not leave this group.')
    } finally {
      setLeaving(false)
    }
  }

  async function deleteGroup() {
    if (!isOwner || deletingGroup) return
    if (!window.confirm(`Delete "${currentGroup.name}"? This will remove the group, its chat, messages, and invitations. This action cannot be undone.`)) return

    setDeletingGroup(true)
    setMemberActionMessage('')
    setMemberActionError('')
    try {
      const res = await fetch(`/api/groups/${currentGroup.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (res.status === 401) { navigate('/login'); return }
      if (!res.ok) throw new Error(data?.message ?? 'Could not delete this group.')
      navigate('/groups', { replace: true })
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Could not delete this group.')
    } finally {
      setDeletingGroup(false)
    }
  }

  return (
    <div className={pageStyles.app}>
      <Sidebar me={me} />
      <main className={pageStyles.main}>
        <div className={styles.content}>
          <Link to="/groups" className={styles.backLink}><ArrowLeft size={16} aria-hidden /> Groups &amp; Friends</Link>

          <header className={`${styles.heading} ${styles.groupHeading}`}>
            <div>
              <p className={styles.eyebrow}>Group</p>
              <h1 title={group.name}>{group.name}</h1>
              <p className={styles.groupDescription}>{group.description || 'No description yet.'}</p>
            </div>
          </header>

          <Card className={`${styles.identity} ${styles.groupIdentity}`}>
            <span className={styles.groupBadge}><Icon size={28} strokeWidth={1.5} aria-hidden /></span>
            <div className={styles.identityText}>
              <h2 title={group.name}>{group.name}</h2>
              <p>Created by <Link to={`/users/${group.createdBy.id}`}>{group.createdBy.name}</Link></p>
              <span>Created {created} · {group.members.length} {group.members.length === 1 ? 'member' : 'members'}</span>
            </div>
            {group.conversationId && (
              <Link to={`/chat?group=${group.id}`} className={styles.groupChatAction}><MessageSquare size={15} aria-hidden /> Open chat</Link>
            )}
          </Card>

          <section className={styles.section} aria-labelledby="group-balances">
            <div className={styles.sectionHeadingRow}>
              <div className={styles.sectionHeading}>
                <h2 id="group-balances">Balances</h2>
                <p>
                  {balances
                    ? balances.myBalance > 0
                      ? `You are owed ${money(balances.myBalance)} in this group.`
                      : balances.myBalance < 0
                        ? `You owe ${money(-balances.myBalance)} in this group.`
                        : 'You are all settled up in this group.'
                    : 'Who owes whom, after recorded payments.'}
                </p>
              </div>
              {balances && balances.youOwe.length > 0 && (
                <Button variant="primary" size="sm" onClick={() => setSettling(true)}>
                  Settle up
                </Button>
              )}
            </div>

            {notice && <p className={styles.note} role="status">{notice}</p>}

            {balances && (balances.youOwe.length > 0 || balances.oweYou.length > 0) ? (
              <ul className={styles.groupList}>
                {balances.youOwe.map((d) => (
                  <li key={`owe-${d.user.id}`} className={styles.groupRow}>
                    <Avatar user={d.user} size={34} />
                    <span className={styles.expenseMain}>
                      <strong>{d.user.name}</strong>
                      <small>you owe</small>
                    </span>
                    <span className={styles.expenseAmount}>
                      <strong className="tabular">{money(d.amount)}</strong>
                    </span>
                  </li>
                ))}
                {balances.oweYou.map((d) => (
                  <li key={`owed-${d.user.id}`} className={styles.groupRow}>
                    <Avatar user={d.user} size={34} />
                    <span className={styles.expenseMain}>
                      <strong>{d.user.name}</strong>
                      <small>owes you</small>
                    </span>
                    <span className={styles.expenseAmount}>
                      <strong className="tabular">{money(d.amount)}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.intro}>
                {balances ? 'No open balances — every expense has been settled.' : 'Balances are not available for this group yet.'}
              </p>
            )}
          </section>

          <section className={styles.section} aria-labelledby="group-expenses">
            <div className={styles.sectionHeading}>
              <h2 id="group-expenses">Expenses ({expenses.length})</h2>
              <p>{expenses.length > 0 ? `Total spent: ${money(expenses.reduce((sum, e) => sum + e.amount, 0))}` : 'Every expense shared in this group.'}</p>
            </div>
            {expenses.length === 0 ? (
              <p className={styles.intro}>{expensesNote || 'No expenses yet — add one from the dashboard.'}</p>
            ) : (
              <ul className={styles.groupList}>
                {expenses.map((e) => {
                  const Icon = categoryIcon[e.category] ?? categoryIcon.other
                  const mine = e.paidBy.id === me.id
                  return (
                    <li key={e.id} className={styles.groupRow}>
                      <span className={styles.groupIcon}><Icon size={19} strokeWidth={1.6} aria-hidden /></span>
                      <span className={styles.expenseMain}>
                        <strong>{e.title}</strong>
                        <small>{mine ? 'You' : e.paidBy.name} paid · {relativeDay(e.date, new Date())}</small>
                      </span>
                      <span className={styles.expenseAmount}>
                        <strong className="tabular">{money(e.amount)}</strong>
                        {e.myShare != null && <small>{mine ? 'you lent' : 'your share'} {money(Math.abs(e.myShare))}</small>}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby="group-members">
            <div className={styles.sectionHeadingRow}>
              <div className={styles.sectionHeading}>
                <h2 id="group-members">Members ({group.members.length})</h2>
                <p>Select a member to view their profile.</p>
              </div>
              {isOwner && (
                <Button variant="primary" size="sm" icon={<UserPlus size={15} />} onClick={() => setAdding(true)}>
                  Add people
                </Button>
              )}
              {!isOwner && (
                <button className={styles.removeBtn} type="button" onClick={leaveGroup} disabled={leaving}>
                  <LogOut size={15} aria-hidden /> {leaving ? 'Leaving…' : 'Leave group'}
                </button>
              )}
            </div>
            {notice && <p className={styles.note} role="status">{notice}</p>}
            {memberActionMessage && <p className={styles.note} role="status">{memberActionMessage}</p>}
            {memberActionError && <p className={styles.note} role="alert">{memberActionError}</p>}
            <ul className={styles.groupList}>
              {group.members.map((m) => (
                <li key={m.user.id} className={styles.groupRow}>
                  <Link to={`/users/${m.user.id}`} className={styles.groupMemberLink}>
                    <Avatar user={m.user} size={34} />
                    <span className={styles.groupName}>{m.user.name}{m.user.id === me.id ? ' (you)' : ''}</span>
                    {m.role === 'owner' && <span className={styles.badge}><Crown size={13} aria-hidden /> Owner</span>}
                    <span className={styles.groupMeta}>{m.user.email}</span>
                  </Link>
                  {isOwner && m.role !== 'owner' && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      disabled={removingMemberId !== null}
                      onClick={() => removeMember(m.user)}
                      aria-label={`Remove ${m.user.name} from group`}
                    >
                      {removingMemberId === m.user.id ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
          {isOwner && (
            <section className={`${styles.section} ${styles.dangerZone}`} aria-labelledby="delete-group">
              <div className={styles.sectionHeading}>
                <h2 id="delete-group">Delete group</h2>
                <p>Permanently remove this group, its chat, messages, and invitations.</p>
              </div>
              <button
                type="button"
                className={styles.deleteGroupButton}
                onClick={deleteGroup}
                disabled={deletingGroup}
              >
                <Trash2 size={15} aria-hidden /> {deletingGroup ? 'Deleting…' : 'Delete group'}
              </button>
            </section>
          )}
        </div>
      </main>
      <MobileNav />
      <SettleUpModal
        open={settling}
        groupId={group.id}
        groupName={group.name}
        debts={balances?.youOwe ?? []}
        onClose={() => setSettling(false)}
        onSettled={(message) => {
          setSettling(false)
          setNotice(message)
          loadBalances()
        }}
      />
      <AddMembersModal
        open={adding}
        groupId={group.id}
        groupName={group.name}
        friends={friends}
        memberIds={group.members.map((m) => m.user.id)}
        onClose={() => setAdding(false)}
        onAdded={(addedUsers) => {
          setGroup((current) => current ? {
            ...current,
            members: [...current.members, ...addedUsers.map((u) => ({ user: u, role: 'member', joinedAt: new Date().toISOString() }))],
          } : current)
          setAdding(false)
          setNotice(addedUsers.length === 1 ? `Added ${addedUsers[0].name} to ${group.name}.` : `Added ${addedUsers.length} people to ${group.name}.`)
        }}
      />
    </div>
  )
}

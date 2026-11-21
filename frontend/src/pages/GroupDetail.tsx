import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Crown, FolderX, LogOut, MessageSquare, Plus, ShieldAlert, Trash2, UserPlus, X } from 'lucide-react'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { AddExpenseModal } from '../components/dashboard/AddExpenseModal'
import { AddMembersModal } from '../components/groups/AddMembersModal'
import { SettleUpModal } from '../components/groups/SettleUpModal'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Toast } from '../components/ui/Toast'
import { iconForKind } from '../lib/GroupKinds'
import { categoryIcon } from '../lib/categories'
import { money, relativeDay } from '../lib/format'
import type { Category, Group, User } from '../types'
import pageStyles from './Dashboard.module.css'
import styles from './GroupDetail.module.css'

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

type ToastTone = 'success' | 'info' | 'error'
interface Confirmation {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<void>
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
  const [expenseRefreshKey, setExpenseRefreshKey] = useState(0)
  const [friends, setFriends] = useState<User[]>([])
  const [addingExpense, setAddingExpense] = useState(false)
  const [adding, setAdding] = useState(false)
  const [settling, setSettling] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [balances, setBalances] = useState<GroupBalances | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [errorStatus, setErrorStatus] = useState<404 | 403 | null>(null)
  const cancelConfirmationRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const [today] = useState(() => new Date())
  const expenseGroup = useMemo<Group | null>(() => group ? ({
    id: group.id,
    name: group.name,
    emoji: '',
    kind: 'other',
    memberIds: group.members.map((member) => member.user.id),
    totalSpent: 0,
    yourBalance: 0,
    description: group.description,
    createdAt: group.createdAt,
  }) : null, [group])
  const expenseGroups = useMemo(() => expenseGroup ? [expenseGroup] : [], [expenseGroup])
  const expenseUsers = useMemo<Record<string, User>>(() => {
    const users = Object.fromEntries((group?.members ?? []).map(({ user }) => [user.id, user]))
    if (me) users[me.id] = me
    return users
  }, [group?.members, me])

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
  }

  useEffect(() => {
    if (!confirmation) return
    cancelConfirmationRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirming) setConfirmation(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmation, confirming])

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
  }, [groupId, navigate, expenseRefreshKey])

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
      setError('')
      setErrorStatus(null)
      try {
        const [profileRes, groupRes] = await Promise.all([
          fetch('/api/my-profile'), fetch(`/api/groups/${groupId}`),
        ])
        if (profileRes.status === 401 || groupRes.status === 401) { navigate('/login'); return }
        const profile = profileRes.ok ? await profileRes.json() : null
        if (profile?.user) setMe(profile.user)
        if (groupRes.status === 404) {
          setErrorStatus(404)
          setError('This group may have been deleted or the link may no longer be valid.')
          return
        }
        if (groupRes.status === 403) {
          setErrorStatus(403)
          setError('You no longer have access to this group.')
          return
        }
        if (!groupRes.ok) throw new Error('Could not load this group.')
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
    const ErrorIcon = errorStatus === 403 ? ShieldAlert : FolderX
    const title = errorStatus === 403 ? 'Access unavailable' : 'Group not found'
    return (
      <div className={pageStyles.app}>
        {me && <Sidebar me={me} />}
        <main className={pageStyles.main}>
          <div className={styles.errorState} role="alert">
            <div className={styles.errorIcon} aria-hidden="true"><ErrorIcon size={34} strokeWidth={1.5} /></div>
            <p className={styles.errorKicker}>{errorStatus === 403 ? 'Private group' : 'Unavailable group'}</p>
            <h1>{title}</h1>
            <p className={styles.errorMessage}>{error}</p>
            <Link to="/groups" className={styles.errorAction}><ArrowLeft size={16} aria-hidden /> Back to groups &amp; friends</Link>
          </div>
        </main>
        {me && <MobileNav />}
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

    setRemovingMemberId(user.id)
    try {
      const res = await fetch(`/api/groups/${currentGroup.id}/members/${user.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not remove this member.')

      setGroup((current) => current ? {
        ...current,
        members: current.members.filter((member) => member.user.id !== user.id),
      } : current)
      showToast(`${user.name} was removed from the group.`)
      loadBalances()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not remove this member.', 'error')
    } finally {
      setRemovingMemberId(null)
    }
  }

  async function leaveGroup() {
    if (isOwner) return

    setLeaving(true)
    try {
      const res = await fetch(`/api/groups/${currentGroup.id}/leave`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not leave this group.')
      navigate('/groups')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not leave this group.', 'error')
    } finally {
      setLeaving(false)
    }
  }

  async function deleteGroup() {
    if (!isOwner || deletingGroup) return

    setDeletingGroup(true)
    try {
      const res = await fetch(`/api/groups/${currentGroup.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (res.status === 401) { navigate('/login'); return }
      if (!res.ok) throw new Error(data?.message ?? 'Could not delete this group.')
      navigate('/groups', { replace: true })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete this group.', 'error')
    } finally {
      setDeletingGroup(false)
    }
  }

  async function confirmAction() {
    if (!confirmation || confirming) return
    setConfirming(true)
    try {
      await confirmation.onConfirm()
      setConfirmation(null)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className={pageStyles.app}>
      <Sidebar me={me} />
      <main className={pageStyles.main}>
        <div className={styles.content}>
          <Link to="/groups" className={styles.backLink}><ArrowLeft size={16} aria-hidden /> Groups &amp; Friends</Link>

          <header className={styles.groupHero}>
            <div className={styles.groupIdentity}>
              <span className={styles.groupBadge}><Icon size={26} strokeWidth={1.6} aria-hidden /></span>
              <div className={styles.groupTitle}>
                <p className={styles.eyebrow}>Shared group</p>
                <h1 title={group.name}>{group.name}</h1>
                {group.description && <p className={styles.groupDescription}>{group.description}</p>}
                <div className={styles.groupMeta}>
                  <span>Created by <Link to={`/users/${group.createdBy.id}`}>{group.createdBy.name}</Link></span>
                  <span>{created}</span>
                  <span>{group.members.length} {group.members.length === 1 ? 'member' : 'members'}</span>
                </div>
              </div>
            </div>
            <div className={styles.headerActions}>
              {group.conversationId && (
                <Link to={`/chat?group=${group.id}`} className={styles.groupChatAction}>
                  <MessageSquare size={16} aria-hidden /> Open chat
                </Link>
              )}
              <Button variant="primary" icon={<Plus size={16} aria-hidden />} onClick={() => setAddingExpense(true)}>
                Add expense
              </Button>
            </div>
          </header>

          <section className={styles.balanceSection} aria-labelledby="group-balances">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="group-balances">Your balance</h2>
                <p>Your share of the group’s expenses after recorded payments.</p>
              </div>
            </div>
            <div className={[
              styles.balanceSummary,
              balances && balances.myBalance > 0 ? styles.balanceOwed : '',
              balances && balances.myBalance < 0 ? styles.balanceOwing : '',
            ].filter(Boolean).join(' ')}>
              <div>
                <span className={styles.balanceLabel}>Net balance</span>
                {balances ? (
                  <>
                    <strong className={styles.balanceValue}>{money(Math.abs(balances.myBalance))}</strong>
                    <p className={styles.balanceStatus}>
                      {balances.myBalance > 0
                        ? 'Others owe you'
                        : balances.myBalance < 0
                          ? 'You owe others'
                          : balances.youOwe.length > 0 || balances.oweYou.length > 0
                            ? 'You owe some members and are owed by others'
                            : 'You are all settled up'}
                    </p>
                  </>
                ) : <p className={styles.balanceStatus}>Loading your balance…</p>}
              </div>
              {balances && balances.youOwe.length > 0 && (
                <Button variant="primary" size="sm" onClick={() => setSettling(true)}>Settle up</Button>
              )}
            </div>

            {balances && (balances.youOwe.length > 0 || balances.oweYou.length > 0) ? (
              <div className={styles.balanceDetails} aria-label="Open balances by person">
                {balances.youOwe.length > 0 && (
                  <div className={styles.debtGroup}>
                    <h3>You owe</h3>
                    <ul className={styles.rows}>
                      {balances.youOwe.map((debt) => (
                        <li key={`owe-${debt.user.id}`} className={styles.debtRow}>
                          <Avatar user={debt.user} size={36} />
                          <span className={styles.personName}>{debt.user.name}</span>
                          <strong className={styles.debtAmount} data-direction="outgoing">{money(debt.amount)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {balances.oweYou.length > 0 && (
                  <div className={styles.debtGroup}>
                    <h3>Owed to you</h3>
                    <ul className={styles.rows}>
                      {balances.oweYou.map((debt) => (
                        <li key={`owed-${debt.user.id}`} className={styles.debtRow}>
                          <Avatar user={debt.user} size={36} />
                          <span className={styles.personName}>{debt.user.name}</span>
                          <strong className={styles.debtAmount} data-direction="incoming">{money(debt.amount)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className={styles.emptyState}>
                {balances ? 'No open balances. Everyone is settled up.' : 'Balance details will appear here.'}
              </p>
            )}
          </section>

          <section className={styles.section} aria-labelledby="group-expenses">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="group-expenses">Expenses <span className={styles.count}>{expenses.length}</span></h2>
                <p>{expenses.length > 0 ? `The group has spent ${money(expenses.reduce((sum, expense) => sum + expense.amount, 0))} in total.` : 'Shared costs, all in one place.'}</p>
              </div>
            </div>
            {expenses.length === 0 ? (
              <p className={styles.emptyState}>{expensesNote || 'No expenses yet. Add the first one to start tracking group costs.'}</p>
            ) : (
              <ul className={styles.rows}>
                {expenses.map((expense) => {
                  const ExpenseIcon = categoryIcon[expense.category] ?? categoryIcon.other
                  const mine = expense.paidBy.id === me.id
                  return (
                    <li key={expense.id} className={styles.listRow}>
                      <span className={styles.expenseIcon}><ExpenseIcon size={18} strokeWidth={1.7} aria-hidden /></span>
                      <span className={styles.expenseMain}>
                        <strong>{expense.title}</strong>
                        <small>{mine ? 'You' : expense.paidBy.name} paid · {relativeDay(expense.date, new Date())}</small>
                      </span>
                      <span className={styles.expenseAmount}>
                        <strong className="tabular">{money(expense.amount)}</strong>
                        {expense.myShare != null && <small>{mine ? 'Your share' : 'Your portion'} {money(Math.abs(expense.myShare))}</small>}
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
                <h2 id="group-members">People in this group <span className={styles.count}>{group.members.length}</span></h2>
                <p>See who’s here and manage the group.</p>
              </div>
              <div className={styles.memberActions}>
                {isOwner && (
                  <Button variant="secondary" size="sm" icon={<UserPlus size={15} />} onClick={() => setAdding(true)}>
                    Add people
                  </Button>
                )}
                {!isOwner && (
                  <button
                    className={styles.leaveButton}
                    type="button"
                    onClick={() => setConfirmation({
                      title: `Leave ${group.name}?`,
                      description: 'You will lose access to this group. Any open balance must be settled before you can leave.',
                      confirmLabel: 'Leave group',
                      onConfirm: leaveGroup,
                    })}
                    disabled={leaving}
                  >
                    <LogOut size={15} aria-hidden /> Leave group
                  </button>
                )}
              </div>
            </div>
            <ul className={styles.rows}>
              {group.members.map((member) => (
                <li key={member.user.id} className={styles.listRow}>
                  <Link to={`/users/${member.user.id}`} className={styles.memberLink}>
                    <Avatar user={member.user} size={38} />
                    <span className={styles.memberInfo}>
                      <strong>{member.user.name}{member.user.id === me.id ? ' (you)' : ''}</strong>
                      <small>{member.user.email}</small>
                    </span>
                  </Link>
                  {member.role === 'owner' && <span className={styles.ownerBadge}><Crown size={13} aria-hidden /> Owner</span>}
                  {isOwner && member.role !== 'owner' && (
                    <button
                      type="button"
                      className={styles.removeButton}
                      disabled={removingMemberId !== null}
                      onClick={() => setConfirmation({
                        title: `Remove ${member.user.name}?`,
                        description: `They will no longer be able to view ${group.name}.`,
                        confirmLabel: 'Remove member',
                        onConfirm: () => removeMember(member.user),
                      })}
                      aria-label={`Remove ${member.user.name} from group`}
                    >
                      {removingMemberId === member.user.id ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {isOwner && (
            <section className={styles.dangerZone} aria-labelledby="delete-group">
              <div className={styles.dangerCopy}>
                <span className={styles.dangerIcon}><AlertTriangle size={17} aria-hidden /></span>
                <div>
                  <h2 id="delete-group">Delete this group</h2>
                  <p>Remove the group and its related chat and records permanently.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.deleteGroupButton}
                onClick={() => setConfirmation({
                  title: `Delete ${group.name}?`,
                  description: 'This permanently deletes the group, chat, messages, invitations, expenses, and settlements. This can’t be undone.',
                  confirmLabel: 'Delete group',
                  onConfirm: deleteGroup,
                })}
                disabled={deletingGroup}
              >
                <Trash2 size={15} aria-hidden /> Delete group
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
          showToast(message)
          loadBalances()
        }}
      />
      {expenseGroup && (
        <AddExpenseModal
          open={addingExpense}
          onClose={() => setAddingExpense(false)}
          onSave={async () => {
            setAddingExpense(false)
            setExpenseRefreshKey((key) => key + 1)
            await loadBalances()
          }}
          groups={expenseGroups}
          users={expenseUsers}
          me={me.id}
          today={today}
        />
      )}
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
          showToast(addedUsers.length === 1 ? `Added ${addedUsers[0].name} to ${group.name}.` : `Added ${addedUsers.length} people to ${group.name}.`)
        }}
      />
      {confirmation && (
        <div
          className={styles.confirmBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirming) setConfirmation(null)
          }}
        >
          <section className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
            <div className={styles.confirmIcon}><AlertTriangle size={19} aria-hidden /></div>
            <button type="button" className={styles.confirmClose} onClick={() => setConfirmation(null)} disabled={confirming} aria-label="Close dialog">
              <X size={18} />
            </button>
            <h2 id="confirm-title">{confirmation.title}</h2>
            <p id="confirm-description">{confirmation.description}</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setConfirmation(null)}
                disabled={confirming}
                ref={cancelConfirmationRef}
              >
                Cancel
              </button>
              <button type="button" className={styles.confirmDanger} onClick={confirmAction} disabled={confirming}>
                {confirming ? 'Please wait…' : confirmation.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
      <Toast
        message={toast?.message ?? null}
        tone={toast?.tone ?? 'success'}
        onDismiss={() => setToast(null)}
      />
    </div>
  )
}

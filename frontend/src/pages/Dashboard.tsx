import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddExpenseModal } from '../components/dashboard/AddExpenseModal'
import { BalanceColumns, BalanceHero } from '../components/dashboard/BalanceOverview'
import { GroupsList } from '../components/dashboard/GroupsList'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { SpendingCard } from '../components/dashboard/SpendingCard'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { Section, SectionLink } from '../components/ui/Section'
import { Toast, type ToastTone } from '../components/ui/Toast'
import { inferCategory, loadActivity } from '../lib/activity'
import { firstName } from '../lib/format'
import { sendReminder } from '../lib/remind'
import type { Activity, FriendBalance, Group, User } from '../types'
import styles from './Dashboard.module.css'

export function Dashboard() {
   const [me, setMe] = useState<User | null>(null)
   const [activity, setActivity] = useState<Activity[]>([])
   const [activityLoading, setActivityLoading] = useState(true)
   const [groupCount, setGroupCount] = useState(0)
   const [adding, setAdding] = useState(false)
   const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)
   const navigate = useNavigate();
   const [groups, setGroupList] = useState<Group[]>([])
   const [debts, setDebt] = useState<FriendBalance[]>([])
   const [users, setUsers] = useState<Record<string, User>>({})
   const NOW = new Date()

   const notify = useCallback((message: string, tone: ToastTone = 'info') => {
      setToast({ message, tone })
   }, [])

   const requestAddExpense = useCallback(() => {
      if (groups.length === 0) {
         notify('You must be in at least one group.')
         return
      }
      setAdding(true)
   }, [groups.length, notify])

   const closeModal = useCallback(() => setAdding(false), [])

   useEffect(() => {

      async function loadDashboard() {
         try {
            const [res1, res2, groupsRes] = await Promise.all([fetch("/api/dashboard", {
               method: 'GET',
               headers: { 'Content-Type': 'application/json' }
            }), fetch('/api/my-profile', { method: 'GET', headers: { 'Content-Type': 'application/json' } }), fetch('/api/groups/me')]);
            if (res1.status === 401 || res2.status === 401 || groupsRes.status === 401) {
               navigate('/login');
               return;
            }
            const DashboardData = await res1.json()
            const profileData = await res2.json()
            const groupsData = groupsRes.ok ? await groupsRes.json().catch(() => null) : null
            const allGroups: any[] = groupsData?.groups ?? []
            const kindById = new Map(allGroups.map((g) => [String(g._id), g.kind]))
            setGroupCount(allGroups.length || (DashboardData.groups?.userRecentGroups ?? []).length)

            setGroupList((DashboardData.groups?.userRecentGroups || []).map((group: any)=>({
                  id: group.groupId,
                  name: group.name,
                  emoji: '',
                  kind: group.kind ?? kindById.get(String(group.groupId)) ?? 'other',
                  memberIds: group.memberIds,
                  totalSpent: 0,
                  yourBalance: group.balance,
                  createdAt: group.createdAt,
               }))
            )
            setMe(profileData.user)

            // userRecentDebts is { youOwe: [...], oweYou: [...] } — not an array.
            // Build FriendBalance[] exactly once; never put the raw object in state.
            const recentDebts = DashboardData.debts?.userRecentDebts
            const userMap: Record<string, User> = {}
            const balanceMap = new Map<string, number>()

            if (profileData.user){
               userMap[profileData.user.id] = profileData.user
            }

            const addDebt = (item: any, sign: 1 | -1) => {
               const u = item?.user
               const id = String(u?._id ?? u?.id ?? item?.payerId ?? item?.debtorId ?? '')
               if (!id) return
               if (u?.username) userMap[id] = { id, name: u.username, email: u.email ?? '', avatar: u.avatar ?? null }
               const amount = Number(item?.totalAmount ?? item?.amount ?? 0)
               if (!Number.isFinite(amount) || amount === 0) return
               balanceMap.set(id, (balanceMap.get(id) ?? 0) + sign * amount)
            }
            for (const item of recentDebts?.youOwe ?? []) addDebt(item, -1)
            for (const item of recentDebts?.oweYou ?? []) addDebt(item, 1)
            const balanceList: FriendBalance[] = [...balanceMap.entries()]
               .map(([userId, amount]) => ({ userId, amount: Math.round(amount * 100) / 100 }))
               .filter((b) => b.amount !== 0)
            // Group members you have no balance with aren't in the debts lists
            // above; resolve their real names so the expense modal can use them.
            for (const g of allGroups) {
               for (const m of g.members ?? []) {
                  const u = m.userId
                  const id = String(u?._id ?? u ?? '')
                  if (id && u?.username) userMap[id] = { id, name: u.username, email: u.email ?? '', avatar: u.avatar ?? null }
               }
            }
            setUsers(userMap)
            setDebt(balanceList)

            // The feed and spending card load after first paint; the
            // balances above are what people come for.
            loadActivity(allGroups.map((g) => String(g._id)))
               .then((feed) => {
                  setActivity(feed.items)
                  setUsers((prev) => ({ ...feed.users, ...prev }))
               })
               .catch((err) => console.error('Failed to load activity: ', err))
               .finally(() => setActivityLoading(false))

         } catch (err) { console.error('Failed to load dashboard: ', err) }
         return;
      }

      loadDashboard()
   }, [])

   // Keyboard shortcut: "n" opens the add-expense dialog.
   useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
         const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement
         if (e.key === 'n' && !typing && !e.metaKey && !e.ctrlKey) requestAddExpense()
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
   }, [requestAddExpense])


   // Temporary test display:
   if (!me) {
      return <div className="page-state" role="status">Loading dashboard…</div>
   }
   return (
      <div className={styles.app}>
         <Sidebar me={me} />

         <main className={styles.main}>
            <div className={styles.content}>
               <Topbar firstName={firstName(me.name)} today={NOW} onAdd={requestAddExpense} />

               <div className={styles.overview}>
                  <BalanceHero balances={debts} groupCount={groupCount} />
                  <SpendingCard items={activity} groups={groups} me={me.id} now={NOW} loading={activityLoading} />
               </div>

               <Section title="Who owes what">
                  <BalanceColumns
                     balances={debts}
                     users={users}
                     onSettle={(u) => {
                        // A settlement belongs to a group, so send the user to a
                        // shared group where the debt can be recorded properly.
                        const shared = groups.find((g) => g.memberIds.includes(u.id))
                        if (shared) navigate(`/groups/${shared.id}`)
                        else notify(`You don't share a group with ${firstName(u.name)} yet.`)
                     }}
                     onRemind={async (u) => { const r = await sendReminder(u.id, firstName(u.name)); notify(r.message, r.ok ? 'success' : 'error') }}
                  />
               </Section>

               <div className={styles.split}>
                  <Section title="Recent activity">
                     <RecentActivity
                        items={activity.slice(0, 7)}
                        users={users}
                        groups={groups}
                        me={me.id}
                        now={NOW}
                        loading={activityLoading}
                     />
                  </Section>
                  <Section title="Groups" action={<SectionLink href="/groups">All groups</SectionLink>}>
                     <GroupsList groups={groups} users={users} items={activity} now={NOW} />
                  </Section>
               </div>
            </div>
         </main>

         <MobileNav onAdd={requestAddExpense} />
         {groups.length > 0 && (
            <AddExpenseModal
               open={adding}
               onClose={closeModal}
               onSave={(expense, group) => {
                  setActivity((prev) => [{ ...expense, category: inferCategory(expense.title, expense.category) }, ...prev])
                  setAdding(false)
                  notify(`Added “${expense.title}” to ${group.name}`, 'success')
               }}
               groups={groups}
               users={users}
               me={me.id}
               today={NOW}
            />
         )}

         <Toast message={toast?.message ?? null} tone={toast?.tone} duration={2600} onDismiss={() => setToast(null)} />
      </div>
   )
}

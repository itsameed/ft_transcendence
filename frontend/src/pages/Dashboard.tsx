import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddExpenseModal } from '../components/dashboard/AddExpenseModal'
import { BalanceOverview } from '../components/dashboard/BalanceOverview'
import { GroupsGrid } from '../components/dashboard/GroupsGrid'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { Section, SectionLink } from '../components/ui/Section'
import { Toast } from '../components/ui/Toast'
// import { NOW, friendBalances, groups, recentActivity, users } from '../data/mock'
import { firstName, money } from '../lib/format'
import { useTheme } from '../lib/useTheme'
import { FriendBalance, Group, type User } from '../types'
import styles from './Dashboard.module.css'

export function Dashboard() {
   const [me, setMe] = useState<User | null>(null)
   const { dark, toggle } = useTheme()
   // const [activity, setActivity] = useState<Activity[]>(recentActivity)
   const [adding, setAdding] = useState(false)
   const [toast, setToast] = useState<string | null>(null)
   const toastTimer = useRef<number>()
   const navigate = useNavigate();
   const [groups, setGroupList] = useState<Group[]>([])
   const [debts, setDebt] = useState<FriendBalance[]>([])
   const [users, setUsers] = useState<Record<string, User>>({})
   const NOW = new Date()

   const notify = useCallback((message: string) => {
      setToast(message)
      window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setToast(null), 2600)
   }, [])

   const closeModal = useCallback(() => setAdding(false), [])

   // Keyboard shortcut: "n" opens the add-expense dialog.
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

            setGroupList((DashboardData.groups?.userRecentGroups || []).map((group: any)=>({
                  id: group.groupId,
                  name: group.name,
                  emoji: '',
                  kind: 'other',
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
               if (u?.username) userMap[id] = { id, name: u.username, email: u.email ?? '' }
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
            if (groupsRes.ok) {
               const groupsData = await groupsRes.json().catch(() => null)
               for (const g of groupsData?.groups ?? []) {
                  for (const m of g.members ?? []) {
                     const u = m.userId
                     const id = String(u?._id ?? u ?? '')
                     if (id && u?.username) userMap[id] = { id, name: u.username, email: u.email ?? '' }
                  }
               }
            }
            setUsers(userMap)
            setDebt(balanceList)

         } catch (err) { console.log('Failed to load dashboard: ', err) }
         return;
      }

      loadDashboard()

      
      const onKey = (e: KeyboardEvent) => {
         const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement
         if (e.key === 'n' && !typing && !e.metaKey && !e.ctrlKey) setAdding(true)
         }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
   }, [])
   
   // Temporary test display:
   if (!me) {
      return (<div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'white' }} >
         Loading dashboard...
      </div>
      )
   }
   return (
      <div className={styles.app}>
         <Sidebar me={me} />

         <main className={styles.main}>
            <div className={styles.content}>
               <Topbar firstName={firstName(me.name)} today={NOW} dark={dark} onToggleTheme={toggle} onAdd={() => setAdding(true)} />

               <BalanceOverview
                  balances={debts}
                  users={users}
                  groupCount={groups.length}
                  onSettle={(u, amount) => notify(`Recorded ${money(amount)} paid to ${firstName(u.name)}`)}
                  onRemind={(u) => notify(`Reminder sent to ${firstName(u.name)}`)}
               />

               <Section title="Groups" action={<SectionLink href="/groups">All groups</SectionLink>}>
                  <GroupsGrid groups={groups} now={NOW} />
               </Section>

               {/* <Section title="Recent activity" action={<SectionLink>View all</SectionLink>}>
                  <RecentActivity items={groups.length > 0 ? activity.slice(0, ACTIVITY_PREVIEW) : []}
                     users={users}
                     groups={groups}
                     me={me.id}
                     now={NOW}
                  />
               </Section> */}
            </div>
         </main>

         <MobileNav onAdd={() => setAdding(true)} />
         {groups.length > 0 ?
            <AddExpenseModal
               open={adding}
               onClose={closeModal}
               onSave={(expense, group) => {
                  // setActivity((prev) => [expense, ...prev])
                  setAdding(false)
                  notify(`Added “${expense.title}” to ${group.name}`)
               }}
               groups={groups}
               users={users}
               me={me.id}
               today={NOW}
            />
         : <Toast message={"You must be in at least one group."} />}

         <Toast message={toast} />
      </div>
   )
}

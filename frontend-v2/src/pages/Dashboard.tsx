import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddExpenseModal } from '../components/dashboard/AddExpenseModal'
import { BalanceOverview } from '../components/dashboard/BalanceOverview'
import { GroupsGrid } from '../components/dashboard/GroupsGrid'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { Section, SectionLink } from '../components/ui/Section'
import { Toast } from '../components/ui/Toast'
// import { NOW, friendBalances, groups, recentActivity, users } from '../data/mock'
import { firstName, money } from '../lib/format'
import { useTheme } from '../lib/useTheme'
import { FriendBalance, Group, type Activity, type User } from '../types'
import styles from './Dashboard.module.css'


/** The dashboard only previews activity; the full list lives on its own page. */
const ACTIVITY_PREVIEW = 5

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
            const [res1, res2] = await Promise.all([fetch("/api/dashboard", {
               method: 'GET',
               headers: { 'Content-Type': 'application/json' }
            }), fetch('/api/my-profile', { method: 'GET', headers: { 'Content-Type': 'application/json' } })]);
            if (res1.status === 401 || res2.status === 401) {
               console.log('Unauthorized (401) -> would navigate to /login')
               navigate('/login');
               return;
            }
            const DashboardData = await res1.json()
            console.log('Dashboard API response:', DashboardData)
            const profileData = await res2.json()
            console.log('Profile API response:', profileData)

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
            setDebt(DashboardData.debts?.userRecentDebts || [])
            setMe(profileData.user)

            const recentDebts = DashboardData.debts?.userRecentDebts
            const userMap: Record<string, User> = {}
            const balanceList: FriendBalance[] = []

            if (profileData.user){
               userMap[profileData.user.id] = profileData.user
            }

            if (recentDebts?.youOwe){
               recentDebts.youOwe.forEach((item: any) => {
                  const u = item.user
                  if(u){
                     userMap[u._id] = {id: u._id, name: u.username, email: ''}
                     balanceList.push({userId: u._id, amount: -item.totalAmount})
                  }
               })
            }
            if (recentDebts?.oweYou){
               recentDebts.oweYou.forEach((item: any) => {
                  const u = item.user
                  if(u){
                     userMap[u._id] = {id: u._id, name: u.username, email: ''}
                     balanceList.push({userId: u._id, amount: item.totalAmount})
                  }
               })
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
   
   console.log('user mail: ', me?.email)
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

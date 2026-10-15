import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'
import { AddExpenseModal } from '../components/dashboard/AddExpenseModal'
import { BalanceHero } from '../components/dashboard/BalanceHero'
import { FriendBalances } from '../components/dashboard/FriendBalances'
import { GroupsGrid } from '../components/dashboard/GroupsGrid'
import { SpendingBreakdown } from '../components/dashboard/SpendingBreakdown'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { Toast } from '../components/ui/Toast'
import { ME, NOW, friendBalances, groups, monthlySpend, recentActivity, users } from '../data/mock'
import { summarize } from '../lib/balances'
import { firstName, money } from '../lib/format'
import { useTheme } from '../lib/useTheme'
import type { Activity } from '../types'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const me = users[ME]
  const { dark, toggle } = useTheme()
  const [activity, setActivity] = useState<Activity[]>(recentActivity)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>()
  const balancesRef = useRef<HTMLDivElement>(null)

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const closeModal = useCallback(() => setAdding(false), [])

  // Keyboard shortcut: "n" opens the add-expense dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement
      if (e.key === 'n' && !typing && !e.metaKey && !e.ctrlKey) setAdding(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={styles.app}>
      <Sidebar me={me} groups={groups} />

      <main className={styles.main}>
        <Topbar
          firstName={firstName(me.name)}
          today={NOW}
          dark={dark}
          onToggleTheme={toggle}
          onAdd={() => setAdding(true)}
          onSettle={() => balancesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />

        <div className={styles.grid}>
          <div className={styles.primary}>
            <div className={styles.hero}>
              <BalanceHero summary={summarize(friendBalances)} />
            </div>
            <div className={styles.groups}>
              <GroupsGrid groups={groups} users={users} now={NOW} />
            </div>
            <div className={styles.activity}>
              <ActivityFeed items={activity} users={users} groups={groups} me={ME} now={NOW} />
            </div>
          </div>

          <div className={styles.secondary}>
            <div className={styles.balances} ref={balancesRef}>
              <FriendBalances
                balances={friendBalances}
                users={users}
                groups={groups}
                onRemind={(u, amount) => notify(`Reminder sent to ${firstName(u.name)} for ${money(amount)}`)}
                onPay={(u, amount) => notify(`Recorded ${money(amount)} paid to ${firstName(u.name)}`)}
              />
            </div>
            <div className={styles.spending}>
              <SpendingBreakdown data={monthlySpend} month="October" />
            </div>
          </div>
        </div>
      </main>

      <MobileNav onAdd={() => setAdding(true)} />

      <AddExpenseModal
        open={adding}
        onClose={closeModal}
        onSave={(expense, group) => {
          setActivity((prev) => [expense, ...prev])
          setAdding(false)
          notify(`Added “${expense.title}” to ${group.name}`)
        }}
        groups={groups}
        users={users}
        me={ME}
        today={NOW}
      />

      <Toast message={toast} />
    </div>
  )
}

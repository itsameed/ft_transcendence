import { useCallback, useEffect, useRef, useState } from 'react'
import { AddExpenseModal } from '../components/dashboard/AddExpenseModal'
import { BalanceOverview } from '../components/dashboard/BalanceOverview'
import { GroupsGrid } from '../components/dashboard/GroupsGrid'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { Section, SectionLink } from '../components/ui/Section'
import { Toast } from '../components/ui/Toast'
import { ME, NOW, friendBalances, groups, recentActivity, users } from '../data/mock'
import { firstName, money } from '../lib/format'
import { useTheme } from '../lib/useTheme'
import type { Activity } from '../types'
import styles from './Dashboard.module.css'

/** The dashboard only previews activity; the full list lives on its own page. */
const ACTIVITY_PREVIEW = 5

export function Dashboard() {
  const me = users[ME]
  const { dark, toggle } = useTheme()
  const [activity, setActivity] = useState<Activity[]>(recentActivity)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>()

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
      <Sidebar me={me} />

      <main className={styles.main}>
        <div className={styles.content}>
          <Topbar firstName={firstName(me.name)} today={NOW} dark={dark} onToggleTheme={toggle} onAdd={() => setAdding(true)} />

          <BalanceOverview
            balances={friendBalances}
            users={users}
            groupCount={groups.length}
            onSettle={(u, amount) => notify(`Recorded ${money(amount)} paid to ${firstName(u.name)}`)}
            onRemind={(u) => notify(`Reminder sent to ${firstName(u.name)}`)}
          />

          <Section title="Groups" action={<SectionLink>All groups</SectionLink>}>
            <GroupsGrid groups={groups} now={NOW} />
          </Section>

          <Section title="Recent activity" action={<SectionLink>View all</SectionLink>}>
            <RecentActivity items={activity.slice(0, ACTIVITY_PREVIEW)} users={users} groups={groups} me={ME} now={NOW} />
          </Section>
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

import { Topbar } from '../components/Topbar'
import { BalanceCard } from '../components/BalanceCard'
import { SpendingCard } from '../components/SpendingCard'
import { GroupCard } from '../components/GroupCard'
import { ActivityCard } from '../components/ActivityCard'
import { PeopleCard } from '../components/PeopleCard'
import { activity, friendBalances, groups, monthlySpend } from '../data/mock'
import './Dashboard.css'

export function Dashboard() {
  return (
    <main className="dashboard">
      <Topbar />

      <div className="dashboard__grid">
        <BalanceCard balances={friendBalances} />
        <SpendingCard months={monthlySpend} />

        <section className="dashboard__groups" aria-labelledby="groups-title">
          <header className="section-header">
            <h2 id="groups-title" className="section-title">Your groups</h2>
            <button type="button" className="link-btn">See all</button>
          </header>
          <div className="groups-grid">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        </section>

        <ActivityCard items={activity} />
        <PeopleCard balances={friendBalances} />
      </div>
    </main>
  )
}

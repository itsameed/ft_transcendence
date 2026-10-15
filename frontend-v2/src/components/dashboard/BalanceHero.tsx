import { ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react'
import type { BalanceSummary } from '../../lib/balances'
import { money } from '../../lib/format'
import styles from './BalanceHero.module.css'

export function BalanceHero({ summary }: { summary: BalanceSummary }) {
  const { net, owedToYou, youOwe, peopleOwingYou, peopleYouOwe } = summary
  const total = owedToYou + youOwe || 1
  const dir = net > 0 ? 'pos' : net < 0 ? 'neg' : 'zero'

  return (
    <section className={styles.hero} aria-labelledby="net-label">
      <div className={styles.top}>
        <div>
          <p id="net-label" className={styles.label}>
            {net > 0 ? 'Overall, you are owed' : net < 0 ? 'Overall, you owe' : 'You are all settled up'}
          </p>
          <p className={styles.net} data-dir={dir}>
            {money(net, { signed: true })}
          </p>
        </div>
        <p className={styles.tip}>
          <Sparkles size={14} />
          Tally simplified 13 debts into 7 payments
        </p>
      </div>

      <div
        className={styles.ratio}
        role="img"
        aria-label={`${money(owedToYou)} owed to you versus ${money(youOwe)} you owe`}
      >
        <span className={styles.ratioPos} style={{ flexGrow: owedToYou / total }} />
        <span className={styles.ratioNeg} style={{ flexGrow: youOwe / total }} />
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statIcon} data-dir="pos">
            <ArrowDownLeft size={16} />
          </span>
          <div>
            <p className={styles.statLabel}>
              <span className={styles.swatch} data-dir="pos" /> Owed to you
            </p>
            <p className={styles.statValue}>{money(owedToYou)}</p>
            <p className={styles.statMeta}>from {peopleOwingYou} friends</p>
          </div>
        </div>
        <div className={styles.stat}>
          <span className={styles.statIcon} data-dir="neg">
            <ArrowUpRight size={16} />
          </span>
          <div>
            <p className={styles.statLabel}>
              <span className={styles.swatch} data-dir="neg" /> You owe
            </p>
            <p className={styles.statValue}>{money(youOwe)}</p>
            <p className={styles.statMeta}>to {peopleYouOwe} friends</p>
          </div>
        </div>
      </div>
    </section>
  )
}

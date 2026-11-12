import { Link } from 'react-router-dom'
import type { Group } from '../../types'
import { money } from '../../lib/format'
import { iconForKind } from '../../lib/GroupKinds'
import styles from './GroupsGrid.module.css'

/** One quiet line of context under the group name. */
function describe(group: Group): string {
   return `${group.memberIds.length} ${group.memberIds.length === 1 ? 'person' : 'people'}`
}

export function GroupsGrid({ groups }: { groups: Group[]; now?: Date }) {
   return (
      <div className={styles.grid}>
         {groups.map((g) => {
            const tone = g.yourBalance > 0 ? 'owed' : g.yourBalance < 0 ? 'owe' : 'settled'
            const Icon = iconForKind(g.kind)
            return (
               <Link key={g.id} to={`/groups/${g.id}`} className={styles.tile}>
                  <span className={styles.emoji} aria-hidden>
                     <Icon size={26} strokeWidth={1.5} />
                  </span>
                  <span className={styles.titles}>
                     <strong>{g.name}</strong>
                     <span>{describe(g)}</span>
                  </span>
                  <span className={styles.balance}>
                     <span>{tone === 'owed' ? 'You’re owed' : tone === 'owe' ? 'You owe' : 'All settled up'}</span>
                     {tone !== 'settled' ? (
                        <strong className="tabular" data-tone={tone}>
                           {money(g.yourBalance)}
                        </strong>
                     ) : (
                        <strong className={styles.settled}>Settled</strong>
                     )}
                  </span>
               </Link>
            )
         })}
      </div>
   )
}

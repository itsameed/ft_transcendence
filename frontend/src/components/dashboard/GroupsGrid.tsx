import { Link } from 'react-router-dom'
import type { Group } from '../../types'
import { money } from '../../lib/format'
import { iconForKind } from '../../lib/GroupKinds'
import styles from './GroupsGrid.module.css'

const groupImages = [
   '/images/dashboard/mountain-trip.webp',
   '/images/dashboard/shared-apartment.webp',
   '/images/dashboard/dinner-together.webp',
]

/** One quiet line of context under the group name. */
function describe(group: Group): string {
   return `${group.memberIds.length} ${group.memberIds.length === 1 ? 'person' : 'people'}`
}

export function GroupsGrid({ groups, onCreate }: { groups: Group[]; now?: Date; onCreate?: () => void }) {
   return (
      <div className={styles.grid}>
         {groups.map((g, index) => {
            const tone = g.yourBalance > 0 ? 'owed' : g.yourBalance < 0 ? 'owe' : 'settled'
            const Icon = iconForKind(g.kind)
            const image = groupImages[index]
            return (
               <Link key={g.id} to={`/groups/${g.id}`} className={styles.tile}>
                  {image ? (
                     <img
                        className={styles.cover}
                        src={image}
                        alt=""
                        loading="lazy"
                     />
                  ) : (
                     <span className={styles.emoji} aria-hidden>
                        <Icon size={26} strokeWidth={1.5} />
                     </span>
                  )}
                  <span className={styles.titles}>                
                     <strong>{g.name}</strong>
                     <span>{describe(g)}</span>
                  </span>
                  <span className={styles.balance}>
                     <span className={styles.badge} data-tone={tone}>
                        {tone === 'owed' ? `You’re owed ${money(g.yourBalance)}` : tone === 'owe' ? `You owe ${money(g.yourBalance)}` : '✓ Settled'}
                     </span>
                  </span>
               </Link>
            )
         })}
         {onCreate && (
            <button type="button" className={styles.createTile} onClick={onCreate}>
               <span className={styles.createIcon} aria-hidden>+</span>
               <strong>Create new group</strong>
               <span>Trip, home, event…</span>
            </button>
         )}
      </div>
   )
}

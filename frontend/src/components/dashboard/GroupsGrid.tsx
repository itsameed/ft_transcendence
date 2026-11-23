import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Group, User } from '../../types'
import { money } from '../../lib/format'
import { iconForKind, groupKindLabel } from '../../lib/GroupKinds'
import { kindTint } from '../../lib/activity'
import type { GroupKind } from '../../types'
import { Avatar } from '../ui/Avatar'
import styles from './GroupsGrid.module.css'

/** One quiet line of context under the group name. */
function describe(group: Group): string {
   const people = `${group.memberIds.length} ${group.memberIds.length === 1 ? 'person' : 'people'}`
   const kind = groupKindLabel[group.kind as GroupKind]
   return kind && group.kind !== 'other' ? `${kind} · ${people}` : people
}

export function GroupsGrid({ groups, users = {}, onCreate }: { groups: Group[]; users?: Record<string, User>; now?: Date; onCreate?: () => void }) {
   return (
      <div className={styles.grid}>
         {groups.map((g) => {
            const tone = g.yourBalance > 0 ? 'owed' : g.yourBalance < 0 ? 'owe' : 'settled'
            const Icon = iconForKind(g.kind)
            return (
               <Link key={g.id} to={`/groups/${g.id}`} className={styles.tile} data-tint={kindTint(g.kind)}>
                  <span className={styles.tileTop}>
                     <span className={`${styles.emoji} tint`} data-tint={kindTint(g.kind)} aria-hidden>
                        <Icon size={22} strokeWidth={1.7} aria-hidden />
                     </span>
                     <span className={styles.stack} aria-hidden>
                        {g.memberIds.slice(0, 4).map((id) => (
                           <Avatar key={id} user={users[id] ?? { id, name: '?', email: '' }} size={26} />
                        ))}
                        {g.memberIds.length > 4 && <span className={styles.more}>+{g.memberIds.length - 4}</span>}
                     </span>
                  </span>
                  <span className={styles.titles}>
                     <strong title={g.name}>{g.name}</strong>
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
               <span className={styles.createIcon} aria-hidden><Plus size={18} aria-hidden /></span>
               <strong>Create new group</strong>
               <span>Trip, home, event…</span>
            </button>
         )}
      </div>
   )
}

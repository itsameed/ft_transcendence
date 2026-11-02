import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GroupsGrid } from '../components/dashboard/GroupsGrid'
import { MobileNav } from '../components/layout/MobileNav'
import { Sidebar } from '../components/layout/Sidebar'
import { Avatar } from '../components/ui/Avatar'
import { Section } from '../components/ui/Section'
import { emojiForKind, groupEmoji } from '../lib/GroupKinds'
import type { Group, User } from '../types'
import dashStyles from './Dashboard.module.css'
import styles from './Group.module.css'

interface ApiMember {
   userId: { _id: string; username: string; email: string }
   role: string
   joinedAt: string
}

interface ApiGroup {
   _id: string
   name: string
   kind: string
   description?: string
   conversationId?: string
   createdAt: string
   updatedAt: string
   members: ApiMember[]
}

export function GroupPage() {
   const [groups, setGroups] = useState<Group[]>([])
   const [users, setUsers] = useState<Record<string, User>>({})
   const [rawGroups, setRawGroups] = useState<ApiGroup[]>([])
   const [me, setMe] = useState<User | null>(null)
   const [error, setError] = useState<string | null>(null)
   const [loading, setLoading] = useState(true)
   const navigate = useNavigate()
   const NOW = new Date()

   useEffect(() => {
      async function loadGroups() {
         try {
            const [groupsRes, profileRes] = await Promise.all([
               fetch('/api/groups/me', {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
               }),
               fetch('/api/my-profile', {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
               }),
            ])

            if (groupsRes.status === 401 || profileRes.status === 401) {
               navigate('/login')
               return
            }
            if (!groupsRes.ok) throw new Error(`Failed to load groups (${groupsRes.status})`)

            const data = await groupsRes.json()
            const profile = profileRes.ok ? await profileRes.json() : null
            if (profile?.user) setMe(profile.user)

            const apiGroups: ApiGroup[] = data.groups ?? []
            const userMap: Record<string, User> = {}
            if (profile?.user) userMap[profile.user.id] = profile.user

            const mapped: Group[] = apiGroups.map((g) => {
               for (const m of g.members ?? []) {
                  if (m.userId) {
                     userMap[m.userId._id] = {
                        id: m.userId._id,
                        name: m.userId.username,
                        email: m.userId.email,
                     }
                  }
               }
               return {
                  id: g._id,
                  name: g.name,
                  emoji: emojiForKind(g.kind),
                  kind: (g.kind in groupEmoji ? g.kind : 'other') as Group['kind'],
                  memberIds: (g.members ?? []).map((m) => m.userId._id),
                  // /api/groups/me sends no expense totals; GroupsGrid shows "All settled up" while 0.
                  totalSpent: 0,
                  yourBalance: 0,
                  description: g.description ?? '',
                  createdAt: g.createdAt,
                  conversationId: g.conversationId,
               }
            })

            setRawGroups(apiGroups)
            setUsers(userMap)
            setGroups(mapped)
         } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load groups')
         } finally {
            setLoading(false)
         }
      }

      loadGroups()
   }, [navigate])

   if (loading || !me) {
      return (
         <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'white' }}>
            {error ?? 'Loading groups...'}
         </div>
      )
   }

   return (
      <div className={dashStyles.app}>
         <Sidebar me={me} />

         <main className={dashStyles.main}>
            <div className={dashStyles.content}>
               <Section title={`Your groups (${groups.length})`}>
                  {groups.length === 0 ? (
                     <p className={styles.empty}>You are not in any group yet.</p>
                  ) : (
                     <GroupsGrid groups={groups} now={NOW} />
                  )}
               </Section>

               {rawGroups.map((g) => (
                  <Section key={g._id} title={g.name}>
                     <ul className={styles.members}>
                        {(g.members ?? []).map((m) => {
                           const user = users[m.userId._id]
                           if (!user) return null
                           return (
                              <li key={m.userId._id} className={styles.member}>
                                 <Avatar user={user} size={30} />
                                 <span>
                                    {user.name}
                                    {me.id === user.id ? ' (You)' : ''}
                                 </span>
                                 <span className={styles.role}>{m.role}</span>
                              </li>
                           )
                        })}
                     </ul>
                  </Section>
               ))}
            </div>
         </main>

         <MobileNav onAdd={() => navigate('/dashboard')} />
      </div>
   )
}

import { useState, useEffect } from "react";
import type {Group, User} from '../types'
import { useNavigate } from "react-router-dom";

export function FriendsPage(){
   const [me, setMe] = useState<User | null>(null)
   const [friends, setFriends] = useState<User[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string|null>(null)
   const navigate = useNavigate()

   
   useEffect(()=>{
      async function loadFriends() {
         try{
            const [friendsRes, profile] = await Promise.all([
               fetch('/api/friendsRes', {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' }
               }),
               fetch('/my-profile',{
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' }
               })
            ])
            if (friendsRes.status == 401 || profile.status == 401){
               navigate('/login')
               return
            }
            if (!friendsRes.ok) throw new Error(`failed to load friends list (${friendsRes.status})`);
            const data = await friendsRes.json();
            setFriends(
               data.friends.map((friend: any) => ({
                  id: friend._id,
                  name: friend.username,
                  email: friend.email,
               }))
            )
            const me = profile.ok ? await profile.json() : null
            if (me?.user) setMe(me.user)
         }
         catch(err){
            setError(err instanceof Error ? err.message : 'failed to load friends list')
         }
         finally{
            setLoading(false)
         }
      }
      loadFriends()
   }, [navigate])

      if (loading || !me) {
      return (
         <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'white' }}>
            {error ?? 'Loading groups...'}
         </div>
      )
   }

   return (
      
   )

}
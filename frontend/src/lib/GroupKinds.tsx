import {
  Briefcase, Car, Coffee, Dumbbell, GraduationCap, Home, Landmark, Music,
  Palmtree, PartyPopper, Plane, Sparkles, Tent, Trophy, Users, UtensilsCrossed, Waves,
  type LucideIcon,
} from 'lucide-react'
import type { GroupKind } from '../types'

export const groupIcon: Record<GroupKind, LucideIcon> = {
  trip: Plane, home: Home, event: PartyPopper, dinner: UtensilsCrossed, party: PartyPopper,
  wedding: Sparkles, vacation: Palmtree, conference: Briefcase, festival: Music,
  concert: Music, sports: Trophy, workshop: GraduationCap, retreat: Sparkles,
  roadtrip: Car, camping: Tent, cruise: Waves, skiing: Dumbbell,
  hiking: Tent, beach: Waves, citytrip: Landmark, other: Users,
}

export function iconForKind(kind: string): LucideIcon {
  return groupIcon[kind as GroupKind] ?? Coffee
}

export const groupKindLabel: Record<GroupKind, string> = {
  trip: 'Trip', home: 'Home', event: 'Event', dinner: 'Dinner', party: 'Party',
  wedding: 'Wedding', vacation: 'Vacation', conference: 'Conference', festival: 'Festival',
  concert: 'Concert', sports: 'Sports', workshop: 'Workshop', retreat: 'Retreat',
  roadtrip: 'Road trip', camping: 'Camping', cruise: 'Cruise', skiing: 'Skiing',
  hiking: 'Hiking', beach: 'Beach', citytrip: 'City trip', other: 'Other',
}

export const GROUP_KINDS = Object.keys(groupKindLabel) as GroupKind[]

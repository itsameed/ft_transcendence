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

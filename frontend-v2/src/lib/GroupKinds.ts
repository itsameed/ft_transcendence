import type { GroupKind } from '../types'

export const groupEmoji: Record<GroupKind, string> = {
  trip: '🏔️', home: '🏠', event: '🎉', dinner: '🍽️', party: '🥳',
  wedding: '💍', vacation: '🏖️', conference: '🎤', festival: '🎪',
  concert: '🎵', sports: '⚽', workshop: '🛠️', retreat: '🧘',
  roadtrip: '🚗', camping: '🏕️', cruise: '🚢', skiing: '⛷️',
  hiking: '🥾', beach: '🏄', citytrip: '🏙️', other: '👥',
}
export function emojiForKind(kind: string): string {
  return groupEmoji[kind as GroupKind] ?? groupEmoji.other
}

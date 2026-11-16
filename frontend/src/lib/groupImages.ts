import type { Group, GroupKind } from '../types'

const imagesByKind: Partial<Record<GroupKind, readonly string[]>> = {
  home: [
    '/images/groups/apartment-1.webp',
    '/images/dashboard/shared-apartment.webp',
    '/images/groups/apartment-3.webp',
  ],

  event: [
    '/images/groups/celebration-1.webp',
    '/images/groups/celebration-2.webp',
    '/images/groups/celebration-3.webp',
  ],

  trip: ['/images/dashboard/mountain-trip.webp'],

  dinner: ['/images/dashboard/dinner-together.webp'],

  other: ['/images/groups/celebration-1.webp'],
}

function stableIndex(value: string, length: number): number {
  let total = 0

  for (const character of value) {
    total += character.charCodeAt(0)
  }

  return total % length
}

export function imageForGroup(
  group: Pick<Group, 'id' | 'kind'>,
): string | undefined {
  const images = imagesByKind[group.kind]

  if (!images || images.length === 0) {
    return undefined
  }

  return images[stableIndex(group.id, images.length)]
}
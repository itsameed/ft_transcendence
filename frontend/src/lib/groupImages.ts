import type { Group, GroupKind } from '../types'

const imagesByKind: Partial<Record<GroupKind, readonly string[]>> = {
  home: [
    '/images/groups/apartment-1.webp',
    '/images/dashboard/shared-apartment.webp',
    '/images/groups/apartment-3.webp',
    '/images/groups/groceries/groceries-1.webp',
    '/images/groups/groceries/groceries-2.webp',
    '/images/groups/groceries/groceries-3.webp',
  ],

  event: [
    '/images/groups/celebration-1.webp',
    '/images/groups/celebration-2.webp',
    '/images/groups/celebration-3.webp',
  ],

  party: [
    '/images/groups/celebration-1.webp',
    '/images/groups/celebration-2.webp',
    '/images/groups/celebration-3.webp',
  ],

  wedding: [
    '/images/groups/celebration-2.webp',
    '/images/groups/celebration-3.webp',
  ],

  festival: [
    '/images/groups/celebration-1.webp',
    '/images/groups/celebration-2.webp',
  ],

  concert: [
    '/images/groups/celebration-1.webp',
    '/images/groups/celebration-3.webp',
  ],

  conference: [
    '/images/groups/celebration-2.webp',
    '/images/groups/celebration-3.webp',
  ],

  trip: [
    '/images/dashboard/mountain-trip.webp',
    '/images/groups/hiking/hiking-2.webp',
    '/images/groups/road-trip/road-trip-2.webp',
  ],

  hiking: [
    '/images/groups/hiking/hiking-1.webp',
    '/images/groups/hiking/hiking-2.webp',
    '/images/groups/hiking/hiking-3.webp',
  ],

  camping: [
    '/images/groups/hiking/hiking-1.webp',
    '/images/groups/hiking/hiking-2.webp',
  ],

  retreat: [
    '/images/groups/hiking/hiking-1.webp',
    '/images/groups/hiking/hiking-3.webp',
  ],

  skiing: [
    '/images/groups/hiking/hiking-2.webp',
    '/images/groups/hiking/hiking-3.webp',
  ],

  roadtrip: [
    '/images/groups/road-trip/road-trip-1.webp',
    '/images/groups/road-trip/road-trip-2.webp',
    '/images/groups/road-trip/road-trip-3.webp',
  ],

  beach: [
    '/images/groups/surf/surf-1.webp',
    '/images/groups/surf/surf-2.webp',
    '/images/groups/surf/surf-3.webp',
  ],

  vacation: [
    '/images/groups/surf/surf-1.webp',
    '/images/groups/surf/surf-3.webp',
    '/images/groups/road-trip/road-trip-1.webp',
  ],

  cruise: [
    '/images/groups/surf/surf-2.webp',
    '/images/groups/surf/surf-3.webp',
  ],

  citytrip: [
    '/images/groups/transport/transport-1.webp',
    '/images/groups/transport/transport-2.webp',
    '/images/groups/transport/transport-3.webp',
    '/images/groups/transport/transport-4.webp',
  ],

  sports: [
    '/images/groups/sports/football-1.webp',
    '/images/groups/sports/football-2.webp',
    '/images/groups/sports/football-3.webp',
  ],

  dinner: [
    '/images/dashboard/dinner-together.webp',
    '/images/groups/restaurant/restaurant-1.webp',
    '/images/groups/restaurant/restaurant-2.webp',
    '/images/groups/restaurant/restaurant-3.webp',
    '/images/groups/dashboard-scenes/dining-1.webp',
    '/images/groups/dashboard-scenes/dining-2.webp',
    '/images/groups/dashboard-scenes/dining-3.webp',
    '/images/groups/dashboard-scenes/dining-4.webp',
    '/images/groups/dashboard-scenes/dining-5.webp',
  ],

  workshop: [
    '/images/groups/apartment-3.webp',
    '/images/groups/dashboard-scenes/dining-3.webp',
  ],

  other: [
    '/images/groups/celebration-1.webp',
    '/images/groups/apartment-1.webp',
    '/images/groups/dashboard-scenes/dining-5.webp',
  ],
}


export function imageForGroup(
  group: Pick<Group, 'kind'>,
  position = 0,
): string | undefined {
  const images = imagesByKind[group.kind]

  if (!images || images.length === 0) {
    return undefined
  }

  return images[position % images.length]
}
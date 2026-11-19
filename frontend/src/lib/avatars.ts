/** Default avatars shipped in `public/avatars`. Keep in sync with backend/src/config/avatars.js. */
export const DEFAULT_AVATARS = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'clay', label: 'Clay' },
  { id: 'stone', label: 'Stone' },
  { id: 'slate', label: 'Slate' },
  { id: 'moss', label: 'Moss' },
  { id: 'plum', label: 'Plum' },
  { id: 'sand', label: 'Sand' },
  { id: 'ink', label: 'Ink' },
] as const

export type DefaultAvatarId = (typeof DEFAULT_AVATARS)[number]['id']

export function defaultAvatarUrl(id: string): string {
  return `/avatars/${id}.svg`
}

/** True when the path points at one of the shipped defaults rather than an upload. */
export function isDefaultAvatar(path?: string | null): boolean {
  return Boolean(path?.startsWith('/avatars/'))
}

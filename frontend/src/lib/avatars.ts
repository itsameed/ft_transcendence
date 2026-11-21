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

/* ── Initials-avatar color palette ──────────────────────────────────── */

/** 8 muted earthy tones that sit well on the warm off-white card. */
export const AVATAR_COLORS = [
  { id: 'terracotta', bg: '#c17a56', text: '#fff', label: 'Terracotta' },
  { id: 'olive',      bg: '#7a8c5e', text: '#fff', label: 'Olive' },
  { id: 'teal',       bg: '#5b8f8f', text: '#fff', label: 'Teal' },
  { id: 'slate',      bg: '#6b7b8d', text: '#fff', label: 'Slate' },
  { id: 'mauve',      bg: '#9b7a8f', text: '#fff', label: 'Mauve' },
  { id: 'clay',       bg: '#b0885a', text: '#fff', label: 'Clay' },
  { id: 'sage',       bg: '#8a9e82', text: '#fff', label: 'Sage' },
  { id: 'charcoal',   bg: '#5a5650', text: '#fff', label: 'Charcoal' },
] as const

export type AvatarColorId = (typeof AVATAR_COLORS)[number]['id']

/** Extract up to two uppercase initials from a name. Falls back to "?" */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Generate a data-URI SVG circle with centred initials. */
export function generateInitialsAvatar(initials: string, colorId: string): string {
  const color = AVATAR_COLORS.find((c) => c.id === colorId) ?? AVATAR_COLORS[0]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <circle cx="48" cy="48" r="48" fill="${color.bg}"/>
  <text x="48" y="48" dy=".35em" text-anchor="middle"
        font-family="Inter Variable, system-ui, sans-serif"
        font-size="${initials.length > 1 ? 32 : 38}" font-weight="600"
        fill="${color.text}">${initials}</text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Render initials on colored background to an image File for uploading. */
export function renderInitialsToFile(initials: string, colorId: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 240
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('Canvas not supported'))
    const color = AVATAR_COLORS.find((c) => c.id === colorId) ?? AVATAR_COLORS[0]

    ctx.beginPath()
    ctx.arc(120, 120, 120, 0, Math.PI * 2)
    ctx.fillStyle = color.bg
    ctx.fill()

    ctx.fillStyle = color.text
    ctx.font = `600 ${initials.length > 1 ? 80 : 96}px 'Inter Variable', system-ui, -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, 120, 125)

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'initials-avatar.png', { type: 'image/png' }))
      } else {
        reject(new Error('toBlob failed'))
      }
    }, 'image/png')
  })
}

import { useEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** True on mouse/trackpad devices. Used to avoid popping the on-screen keyboard on phones. */
export function prefersFinePointer() {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches
}

/**
 * Modal dialog behaviour in one place:
 * - moves focus in on open: the `[data-autofocus]` element (or the first
 *   field) on desktop, the dialog itself on touch so no keyboard pops up
 * - keeps Tab / Shift+Tab inside the dialog
 * - Escape calls `onClose`
 * - puts focus back on whatever opened it once it closes
 * Dialogs stack: when one opens on top of another (e.g. "Discard this
 * expense?"), only the topmost one reacts to Escape and Tab.
 */
const openDialogs: HTMLElement[] = []

export function useDialog<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
): RefObject<T> {
  const ref = useRef<T>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement as HTMLElement | null

    const focusables = () =>
      [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)

    if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1')
    const preferred = dialog.querySelector<HTMLElement>('[data-autofocus]')
    const firstField = dialog.querySelector<HTMLElement>('input:not([disabled]),select:not([disabled]),textarea:not([disabled])')
    const target = prefersFinePointer() ? preferred ?? firstField ?? focusables()[0] ?? dialog : dialog
    target.focus({ preventScroll: true })
    openDialogs.push(dialog)

    function onKeyDown(event: KeyboardEvent) {
      if (openDialogs[openDialogs.length - 1] !== dialog) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        dialog!.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      // Focus on the dialog box itself (touch start) or somehow outside it:
      // step straight to the first or last control instead of leaving.
      const insideControls = active !== null && items.includes(active)
      if (!insideControls) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      const index = openDialogs.lastIndexOf(dialog)
      if (index !== -1) openDialogs.splice(index, 1)
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [open])

  return ref
}

/** Jumps keyboard users past the sidebar to the page's <main>. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="skip-link"
      onClick={(event) => {
        const main = document.querySelector<HTMLElement>('main')
        if (!main) return
        event.preventDefault()
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
        main.focus()
        main.scrollIntoView({ block: 'start' })
      }}
    >
      Skip to main content
    </a>
  )
}

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Split expenses with friends'],
  [/^\/login/, 'Sign in'],
  [/^\/signup/, 'Create account'],
  [/^\/verify-email/, 'Verify your email'],
  [/^\/dashboard/, 'Dashboard'],
  [/^\/groups\/[^/]+/, 'Group'],
  [/^\/groups/, 'Groups & Friends'],
  [/^\/chat/, 'Chat'],
  [/^\/profile/, 'Your profile'],
  [/^\/settings/, 'Settings'],
  [/^\/users\//, 'Profile'],
  [/^\/notifications/, 'Notifications'],
  [/^\/admin/, 'Admin'],
  [/^\/terms/, 'Terms of Service'],
  [/^\/privacy/, 'Privacy Policy'],
]

/** Keeps the tab title in step with the route, so screen readers announce where you landed. */
export function RouteTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const match = TITLES.find(([pattern]) => pattern.test(pathname))
    document.title = `${match ? match[1] : 'Page not found'} · Splitify`
  }, [pathname])
  return null
}

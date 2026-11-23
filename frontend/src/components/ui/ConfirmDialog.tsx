import { useCallback, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, HelpCircle, X } from 'lucide-react'
import { useDialog } from '../../lib/a11y'
import styles from './ConfirmDialog.module.css'

export interface ConfirmOptions {
  title: string
  description?: ReactNode
  /** Name the action ("Remove friend"), never just "OK". */
  confirmLabel: string
  cancelLabel?: string
  /** `danger` for destructive actions: red button and warning icon. */
  tone?: 'danger' | 'default'
  /**
   * Optional async work to run before closing. While it runs the buttons
   * are disabled and the confirm button reads "Please wait…". If it throws,
   * the dialog stays open so the person can retry or cancel.
   */
  onConfirm?: () => Promise<void> | void
}

interface Props extends ConfirmOptions {
  open: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Accessible confirmation (role="alertdialog"): focus starts on Cancel, the
 * safe choice; Tab stays inside; Escape cancels; focus returns afterwards.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useDialog<HTMLElement>(open, () => {
    if (!busy) onCancel()
  })
  if (!open) return null

  const Icon = tone === 'danger' ? AlertTriangle : HelpCircle

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <section
        ref={ref}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
      >
        <div className={styles.icon} data-tone={tone}>
          <Icon size={19} aria-hidden />
        </div>
        <button type="button" className={styles.close} onClick={onCancel} disabled={busy} aria-label="Close dialog">
          <X size={18} aria-hidden />
        </button>
        <h2 id="confirm-dialog-title">{title}</h2>
        {description && <p id="confirm-dialog-description">{description}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy} data-autofocus>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? styles.danger : styles.primary}
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

/**
 * Promise-style confirmation:
 *
 *   const [confirm, confirmDialog] = useConfirm()
 *   if (await confirm({ title: 'Remove Salma?', confirmLabel: 'Remove friend' })) …
 *   return <>…{confirmDialog}</>
 *
 * Resolves true when confirmed (after `onConfirm` finishes, if given), false
 * when cancelled.
 */
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [busy, setBusy] = useState(false)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false) // a newer question replaces an unanswered one
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const settle = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  const handleConfirm = async () => {
    if (!options) return
    if (!options.onConfirm) {
      settle(true)
      return
    }
    setBusy(true)
    try {
      await options.onConfirm()
      settle(true)
    } catch {
      // Leave it open: the caller reports the error (toast); they can retry.
    } finally {
      setBusy(false)
    }
  }

  const element = (
    <ConfirmDialog
      open={options !== null}
      title={options?.title ?? ''}
      description={options?.description}
      confirmLabel={options?.confirmLabel ?? ''}
      cancelLabel={options?.cancelLabel}
      tone={options?.tone}
      busy={busy}
      onConfirm={handleConfirm}
      onCancel={() => settle(false)}
    />
  )

  return [confirm, element]
}

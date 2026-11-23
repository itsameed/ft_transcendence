import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { User } from '../../types'
import { useDialog } from '../../lib/a11y'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { money } from '../../lib/format'
import styles from './CreateGroupModal.module.css'

interface Props {
  open: boolean
  groupId: string
  groupName: string
  /** Who the caller owes, with the outstanding amount. */
  debts: { user: User; amount: number }[]
  onClose: () => void
  onSettled: (message: string) => void
}

export function SettleUpModal({ open, groupId, groupName, debts, onClose, onSettled }: Props) {
  const [targetId, setTargetId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const first = debts[0]
    setTargetId(first?.user.id ?? '')
    setAmount(first ? String(first.amount) : '')
    setError('')
    setSaving(false)
  }, [open, debts])

  const dialogRef = useDialog(open, onClose)
  const amountRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const target = debts.find((d) => d.user.id === targetId)
  const parsed = Number(amount)

  function pick(id: string) {
    setTargetId(id)
    const debt = debts.find((d) => d.user.id === id)
    setAmount(debt ? String(debt.amount) : '')
    setError('')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!target || !Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero.')
      amountRef.current?.focus()
      return
    }
    if (parsed > target.amount) {
      setError(`You owe ${target.user.name} ${money(target.amount)}, so you can pay up to that.`)
      amountRef.current?.focus()
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, toUserId: targetId, amount: parsed }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not record the payment.')
      onSettled(`Recorded ${money(parsed)} paid to ${target?.user.name ?? 'them'}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="settle-title">
        <header className={styles.header}>
          <h2 id="settle-title">Settle up in {groupName}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </header>

        <form className={styles.body} onSubmit={submit} noValidate>
          <fieldset className={styles.friends}>
            <legend>Who are you paying?</legend>
            {debts.length === 0 ? (
              <p className={styles.empty}>You don’t owe anyone in this group.</p>
            ) : (
              <ul className={styles.friendList}>
                {debts.map((d) => (
                  <li key={d.user.id}>
                    <label className={styles.friendRow}>
                      <input
                        type="radio"
                        name="settle-target"
                        checked={targetId === d.user.id}
                        onChange={() => pick(d.user.id)}
                      />
                      <Avatar user={d.user} size={30} />
                      <span className={styles.friendName}>{d.user.name}</span>
                      <span className={styles.friendEmail}>{money(d.amount)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <label className={styles.field}>
            <span>Amount</span>
            <input
              ref={amountRef}
              type="number"
              name="settle-amount"
              autoComplete="off"
              inputMode="decimal"
              min="0.01"
              max={target?.amount}
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); if (error) setError('') }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'settle-error settle-hint' : 'settle-hint'}
              placeholder="0.00"
              disabled={debts.length === 0}
            />
          </label>

          <p id="settle-hint" className={styles.hint}>
            {target ? `You can pay up to ${money(target.amount)}. ` : ''}
            This records a payment. The expenses stay in the group’s history — only the balance changes.
          </p>

          <div className={styles.footer}>
            <span id="settle-error" className={styles.error} role="alert">{error}</span>
            <span className={styles.footerActions}>
              <Button type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving || debts.length === 0} aria-busy={saving}>
                {saving ? 'Recording…' : 'Record payment'}
              </Button>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

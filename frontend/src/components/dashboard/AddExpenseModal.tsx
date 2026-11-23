import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode, type SelectHTMLAttributes } from 'react'
import type { Category, Expense, Group, User } from '../../types'
import { splitEvenly } from '../../lib/balances'
import { CURRENCY, categoryLabel, firstName, money } from '../../lib/format'
import { useDialog } from '../../lib/a11y'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { useConfirm } from '../ui/ConfirmDialog'
import styles from './AddExpenseModal.module.css'

type SplitMode = 'equal' | 'exact' | 'percent'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (expense: Expense, group: Group) => void | Promise<void>
  groups: Group[]
  users: Record<string, User>
  me: string
  today: Date
}

const CATEGORIES = Object.keys(categoryLabel) as Category[]
const MAX_EXPENSE_AMOUNT = 100000
const MAX_EXPENSE_DESCRIPTION_LENGTH = 140

const SPLIT_MODES: [SplitMode, string][] = [
  ['equal', 'Equally'],
  ['exact', 'Exact'],
  ['percent', 'Percent'],
]

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={styles.select}>
      <select {...props} />
      <ChevronDown size={16} aria-hidden />
    </span>
  )
}

export function AddExpenseModal({ open, onClose, onSave, groups, users, me, today }: Props) {
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [groupId, setGroupId] = useState(groups[0].id)
  const [paidBy, setPaidBy] = useState(me)
  const [date, setDate] = useState(toDateInput(today))
  const [mode, setMode] = useState<SplitMode>('equal')
  const [included, setIncluded] = useState<string[]>(groups[0].memberIds)
  const [custom, setCustom] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirm, confirmDialog] = useConfirm()
  const [saveError, setSaveError] = useState('')
  const [errors, setErrors] = useState<{ amount?: string; title?: string; split?: string }>({})
  const amountRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const splitRef = useRef<HTMLParagraphElement>(null)

  const group = groups.find((g) => g.id === groupId)!
  const total = parseFloat(amount) || 0
  const exceedsMax = total > MAX_EXPENSE_AMOUNT

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (!open) return
    setAmount('')
    setTitle('')
    setCategory('food')
    setGroupId(groups[0].id)
    setPaidBy(me)
    setDate(toDateInput(today))
    setMode('equal')
    setIncluded(groups[0].memberIds)
    setCustom({})
    setErrors({})
  }, [open, groups, me, today])

  // Escape, backdrop click and Cancel all come through here, so a half-typed
  // expense is never thrown away without asking.
  const dirty = amount !== '' || title.trim() !== ''
  async function requestClose() {
    if (saving) return
    if (dirty) {
      const discard = await confirm({
        title: 'Discard this expense?',
        description: 'The amount and description you entered will be lost.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
      })
      if (!discard) return
    }
    onClose()
  }
  const dialogRef = useDialog(open, requestClose)

  function changeGroup(id: string) {
    const next = groups.find((g) => g.id === id)!
    setGroupId(id)
    setIncluded(next.memberIds)
    setPaidBy(next.memberIds.includes(paidBy) ? paidBy : me)
    setCustom({})
  }

  function toggle(userId: string) {
    setIncluded((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  // Each included member's share in money, plus how much is left to assign.
  const { shares, remaining } = useMemo(() => {
    const members = group.memberIds.filter((id) => included.includes(id))
    if (mode === 'equal') {
      const parts = splitEvenly(total, members.length)
      return { shares: Object.fromEntries(members.map((id, i) => [id, parts[i]])), remaining: 0 }
    }
    const values = Object.fromEntries(members.map((id) => [id, parseFloat(custom[id] ?? '') || 0]))
    const sum = Object.values(values).reduce((a, b) => a + b, 0)
    if (mode === 'exact') return { shares: values, remaining: total - sum }
    return {
      shares: Object.fromEntries(members.map((id) => [id, (total * values[id]) / 100])),
      remaining: 100 - sum,
    }
  }, [group, included, mode, total, custom])

  const balanced = Math.abs(remaining) < 0.01

  /** Inline errors for each field, and focus the first one that needs fixing. */
  function validate() {
    const next: typeof errors = {}
    if (!(total > 0)) next.amount = 'Enter how much it cost.'
    else if (exceedsMax) next.amount = `The maximum for one expense is ${money(MAX_EXPENSE_AMOUNT)}.`
    if (title.trim() === '') next.title = 'Say what it was for, e.g. “Dinner” or “Taxi”.'
    if (included.length === 0) next.split = 'Pick at least one person to split with.'
    else if (mode !== 'equal' && !balanced) {
      next.split = mode === 'exact'
        ? `The shares must add up to ${money(total)}.`
        : 'The percentages must add up to 100%.'
    }
    setErrors(next)
    if (next.amount) amountRef.current?.focus()
    else if (next.title) titleRef.current?.focus()
    else if (next.split) splitRef.current?.focus()
    return Object.keys(next).length === 0
  }

  async function save() {
    if (saving || !validate()) return
    setSaving(true)
    setSaveError('')
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    try {
      // Persist first: the backend creates the expense from these fields.
      // equal -> participants share evenly; exact/percent -> customSplit.
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          amount: total,
          description: title.trim(),
          splitMethod: mode === 'equal' ? 'equal' : 'custom',
          paidBy,
          participants: JSON.stringify(included),
          customSplits: JSON.stringify(
            mode === 'equal' ? [] : Object.entries(shares).map(([userId, value]) => ({ user: userId, amount: Math.round(value * 100) / 100 })),
          ),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not save the expense.')
      await onSave(
        {
          type: 'expense',
          id: `e_${now.getTime()}`,
          groupId,
          title: title.trim(),
          category,
          amount: total,
          paidBy,
          shares: Object.entries(shares).map(([userId, value]) => ({ userId, amount: Math.round(value * 100) / 100 })),
          createdAt: `${date}T${hh}:${mm}:00`,
        },
        group,
      )
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save the expense.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const name = (id: string) => (id === me ? 'You' : users[id]?.name ?? 'Unknown member')

  const summary =
    included.length === 0
      ? 'Pick at least one person to split with.'
      : mode === 'equal'
        ? `Split between ${included.length} ${included.length === 1 ? 'person' : 'people'} · ${money(total / included.length || 0)} each`
        : balanced
          ? 'Everything is assigned.'
          : mode === 'exact'
            ? `${money(Math.abs(remaining))} ${remaining > 0 ? 'left to assign' : 'more than the total'}`
            : `${Math.abs(Math.round(remaining * 100) / 100)}% ${remaining > 0 ? 'left to assign' : 'over 100%'}`

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <div ref={dialogRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
        <header className={styles.header}>
          <h2 id="add-expense-title">New expense</h2>
          <button type="button" className={styles.close} onClick={requestClose} aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </header>

        <form
          className={styles.body}
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
          noValidate
        >
          <label className={styles.amount}>
            <span className="visually-hidden">Amount</span>
            <input
              ref={amountRef}
              data-autofocus
              type="number"
              name="amount"
              autoComplete="off"
              inputMode="decimal"
              max={MAX_EXPENSE_AMOUNT}
              step="0.01"
              placeholder="0"
              value={amount}
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.]/g, ''))
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }))
              }}
              style={{ width: `${Math.max(amount.length, 1) + 0.5}ch` }}
            />
            <span>{CURRENCY}</span>
          </label>
          {(errors.amount || exceedsMax) && (
            <p id="expense-amount-error" className={styles.amountError} role="alert">
              {errors.amount ?? `The maximum for one expense is ${money(MAX_EXPENSE_AMOUNT)}.`}
            </p>
          )}

          <div className={styles.titleField}>
            <input
              ref={titleRef}
              className={styles.input}
              name="description"
              autoComplete="off"
              placeholder="What was it for? e.g. Dinner at the riad…"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
              }}
              maxLength={MAX_EXPENSE_DESCRIPTION_LENGTH}
              aria-label="Description"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? 'expense-title-error' : undefined}
            />
            {errors.title && <p id="expense-title-error" className={styles.fieldError} role="alert">{errors.title}</p>}
          </div>

          <div className={styles.fields}>
            <Field label="Group">
              <Select value={groupId} onChange={(e) => changeGroup(e.target.value)}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Paid by">
              <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {group.memberIds.map((id) => (
                  <option key={id} value={id}>
                    {name(id)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <div className={styles.split}>
            <div className={styles.splitHead}>
              <h3>Split</h3>
              <div className={styles.segmented} role="group" aria-label="Split method">
                {SPLIT_MODES.map(([m, label]) => (
                  <button
                    type="button"
                    key={m}
                    aria-pressed={mode === m}
                    className={mode === m ? styles.segOn : ''}
                    onClick={() => {
                      setMode(m)
                      setCustom({})
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ul className={styles.members}>
              {group.memberIds.map((id) => {
                const on = included.includes(id)
                return (
                  <li key={id} className={`${styles.member} ${on ? '' : styles.memberOff}`}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-label={`Include ${name(id)}`}
                      className={`${styles.check} ${on ? styles.checkOn : ''}`}
                      onClick={() => toggle(id)}
                    >
                      {on && <Check size={13} strokeWidth={3} aria-hidden />}
                    </button>
                    <Avatar user={users[id] ?? { id, name: 'Unknown member', email: '' }} size={30} />
                    <span className={styles.memberName}>
                      {id === me ? 'You' : firstName(name(id))}
                      {id === paidBy && <em>paid</em>}
                    </span>
                    {on && mode === 'equal' && <span className={`${styles.share} tabular`}>{money(shares[id] ?? 0)}</span>}
                    {on && mode !== 'equal' && (
                      <span className={styles.shareInput}>
                        {mode === 'percent' && <small className="tabular">{money(shares[id] ?? 0)}</small>}
                        <label>
                          <input
                            name={`share-${id}`}
                            autoComplete="off"
                            inputMode="decimal"
                            placeholder="0"
                            value={custom[id] ?? ''}
                            onChange={(e) => setCustom((prev) => ({ ...prev, [id]: e.target.value.replace(/[^\d.]/g, '') }))}
                            aria-label={`${name(id)} share`}
                          />
                          <span>{mode === 'percent' ? '%' : CURRENCY}</span>
                        </label>
                      </span>
                    )}
                    {!on && <span className={styles.share}>Not included</span>}
                  </li>
                )
              })}
            </ul>

            <p
              ref={splitRef}
              tabIndex={-1}
              className={styles.summary}
              data-warn={Boolean(errors.split) || included.length === 0 || (mode !== 'equal' && !balanced)}
              aria-live="polite"
            >
              {errors.split && !(included.length > 0 && (mode === 'equal' || balanced)) ? errors.split : summary}
            </p>
          </div>

          {saveError && <p role="alert" className={styles.saveError}>{saveError}</p>}
          <footer className={styles.footer}>
            <Button type="button" variant="ghost" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving} aria-busy={saving}>
              {saving ? 'Saving…' : 'Save expense'}
            </Button>
          </footer>
        </form>
      </div>
      {confirmDialog}
    </div>
  )
}

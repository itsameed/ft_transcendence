import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode, type SelectHTMLAttributes } from 'react'
import type { Category, Expense, Group, User } from '../../types'
import { splitEvenly } from '../../lib/balances'
import { CURRENCY, categoryLabel, firstName, money } from '../../lib/format'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import styles from './AddExpenseModal.module.css'

type SplitMode = 'equal' | 'exact' | 'percent'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (expense: Expense, group: Group) => void
  groups: Group[]
  users: Record<string, User>
  me: string
  today: Date
}

const CATEGORIES = Object.keys(categoryLabel) as Category[]

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

  const group = groups.find((g) => g.id === groupId)!
  const total = parseFloat(amount) || 0

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
  }, [open, groups, me, today])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
  const valid = total > 0 && title.trim() !== '' && included.length > 0 && balanced

  function save() {
    if (!valid) return
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    onSave(
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
  }

  if (!open) return null

  const name = (id: string) => (id === me ? 'You' : users[id].name)

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
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
        <header className={styles.header}>
          <h2 id="add-expense-title">New expense</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <form
          className={styles.body}
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <label className={styles.amount}>
            <span className="visually-hidden">Amount</span>
            <input
              autoFocus
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              style={{ width: `${Math.max(amount.length, 1) + 0.5}ch` }}
            />
            <span>{CURRENCY}</span>
          </label>

          <input
            className={styles.input}
            placeholder="What was it for?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Description"
          />

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
              <div className={styles.segmented} role="tablist" aria-label="Split method">
                {SPLIT_MODES.map(([m, label]) => (
                  <button
                    type="button"
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
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
                      {on && <Check size={13} strokeWidth={3} />}
                    </button>
                    <Avatar user={users[id]} size={30} />
                    <span className={styles.memberName}>
                      {id === me ? 'You' : firstName(users[id].name)}
                      {id === paidBy && <em>paid</em>}
                    </span>
                    {on && mode === 'equal' && <span className={`${styles.share} tabular`}>{money(shares[id] ?? 0)}</span>}
                    {on && mode !== 'equal' && (
                      <span className={styles.shareInput}>
                        {mode === 'percent' && <small className="tabular">{money(shares[id] ?? 0)}</small>}
                        <label>
                          <input
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

            <p className={styles.summary} data-warn={included.length === 0 || (mode !== 'equal' && !balanced)} aria-live="polite">
              {summary}
            </p>
          </div>

          <footer className={styles.footer}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!valid}>
              Save expense
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}

import { Check, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Category, Expense, Group, User } from '../../types'
import { splitEvenly } from '../../lib/balances'
import { categoryIcon } from '../../lib/categories'
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

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
        <header className={styles.header}>
          <h2 id="add-expense-title">Add an expense</h2>
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
            placeholder="What was it for? e.g. Dinner at the riad"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Description"
          />

          <div className={styles.chips} role="radiogroup" aria-label="Category">
            {CATEGORIES.map((c) => {
              const Icon = categoryIcon[c]
              return (
                <button
                  type="button"
                  key={c}
                  role="radio"
                  aria-checked={category === c}
                  className={`${styles.chip} ${category === c ? styles.chipOn : ''}`}
                  onClick={() => setCategory(c)}
                >
                  <Icon size={14} />
                  {categoryLabel[c]}
                </button>
              )
            })}
          </div>

          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Group</span>
              <select value={groupId} onChange={(e) => changeGroup(e.target.value)}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Paid by</span>
              <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {group.memberIds.map((id) => (
                  <option key={id} value={id}>
                    {name(id)}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          <div className={styles.splitHead}>
            <h3>Split</h3>
            <div className={styles.segmented} role="tablist" aria-label="Split method">
              {(
                [
                  ['equal', 'Equally'],
                  ['exact', 'Exact amounts'],
                  ['percent', 'Percentages'],
                ] as const
              ).map(([m, label]) => (
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
                  {!on && <span className={styles.share}>not included</span>}
                </li>
              )
            })}
          </ul>

          <div className={styles.summary} data-ok={mode === 'equal' || balanced}>
            {included.length === 0
              ? 'Pick at least one person'
              : mode === 'equal'
                ? `${included.length} people · ${money(total / included.length || 0)} each`
                : balanced
                  ? 'Adds up — nice.'
                  : mode === 'exact'
                    ? `${money(Math.abs(remaining))} ${remaining > 0 ? 'left to assign' : 'over the total'}`
                    : `${Math.abs(Math.round(remaining * 100) / 100)}% ${remaining > 0 ? 'left to assign' : 'over 100%'}`}
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

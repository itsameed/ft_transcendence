import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import type { Group, GroupKind, User } from '../../types'
import { GROUP_KINDS, groupKindLabel, iconForKind } from '../../lib/GroupKinds'
import { useDialog } from '../../lib/a11y'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import styles from './CreateGroupModal.module.css'

interface Props {
  open: boolean
  friends: User[]
  onClose: () => void
  onCreated: (group: Group) => void
}

export function CreateGroupModal({ open, friends, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<GroupKind>('other')
  const [picked, setPicked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setKind('other')
    setPicked([])
    setError('')
    setSaving(false)
  }, [open ])

  const dialogRef = useDialog(open, onClose)
  const nameRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Give your group a name, e.g. “Lisbon trip”.')
      nameRef.current?.focus()
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), kind, memberIds: picked }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not create the group.')
      const g = data.group
      onCreated({
        id: String(g._id ?? g.id),
        name: g.name,
        emoji: '',
        kind: (g.kind || kind) as Group['kind'],
        memberIds: (g.members ?? []).map((m: any) => String(m.userId?._id ?? m.userId)),
        totalSpent: 0,
        yourBalance: 0,
        description: g.description ?? '',
        createdAt: g.createdAt ?? new Date().toISOString(),
        conversationId: g.conversationId ?? undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the group.')
    } finally {
      setSaving(false)
    }
  }

  // Arrow keys move through the category radios; only the checked one is a Tab stop.
  function onKindKey(event: KeyboardEvent<HTMLDivElement>) {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const index = (GROUP_KINDS.indexOf(kind) + delta + GROUP_KINDS.length) % GROUP_KINDS.length
    setKind(GROUP_KINDS[index])
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[index]?.focus()
  }

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="create-group-title">
        <header className={styles.header}>
          <h2 id="create-group-title">New group</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </header>

        <form className={styles.body} onSubmit={submit} noValidate>
          <label className={styles.field}>
            <span>Group name</span>
            <input
              ref={nameRef}
              data-autofocus
              name="group-name"
              autoComplete="off"
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError('') }}
              placeholder="e.g. Lisbon trip…"
              required
              maxLength={60}
              aria-invalid={error && !name.trim() ? true : undefined}
              aria-describedby={error ? 'create-group-error' : undefined}
            />
          </label>

          <label className={styles.field}>
            <span>Description <em>(optional)</em></span>
            <input
              name="group-description"
              autoComplete="off"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Rent and bills for the flat…"
              maxLength={140}
            />
          </label>

          <fieldset className={styles.friends}>
            <legend>Category</legend>
            <div className={styles.kindGrid} role="radiogroup" aria-label="Group category" onKeyDown={onKindKey}>
              {GROUP_KINDS.map((k) => {
                const Icon = iconForKind(k)
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={kind === k}
                    tabIndex={kind === k ? 0 : -1}
                    className={`${styles.kindOption} ${kind === k ? styles.kindOn : ''}`}
                    onClick={() => setKind(k)}
                  >
                    <Icon size={17} strokeWidth={1.75} aria-hidden />
                    {groupKindLabel[k]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className={styles.friends}>
            <legend>Add friends {picked.length > 0 ? `(${picked.length} selected)` : ''}</legend>
            {friends.length === 0 ? (
              <p className={styles.empty}>You have no friends yet — you can create the group now and invite people later.</p>
            ) : (
              <ul className={styles.friendList}>
                {friends.map((f) => (
                  <li key={f.id}>
                    <label className={styles.friendRow}>
                      <input type="checkbox" checked={picked.includes(f.id)} onChange={() => toggle(f.id)} />
                      <Avatar user={f} size={30} />
                      <span className={styles.friendName}>{f.name}</span>
                      <span className={styles.friendEmail}>{f.email}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div className={styles.footer}>
            <span id="create-group-error" className={styles.error} role="alert">{error}</span>
            <span className={styles.footerActions}>
              <Button type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving} aria-busy={saving}>{saving ? 'Creating…' : 'Create group'}</Button>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

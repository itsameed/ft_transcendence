import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Group, User } from '../../types'
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
  const [picked, setPicked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setPicked([])
    setError('')
    setSaving(false)
  }, [open ])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!name.trim()) { setError('Give your group a name.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), memberIds: picked }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Could not create the group.')
      const g = data.group
      onCreated({
        id: String(g._id ?? g.id),
        name: g.name,
        emoji: '',
        kind: (g.kind || 'other') as Group['kind'],
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

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="create-group-title">
        <header className={styles.header}>
          <h2 id="create-group-title">New group</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <form className={styles.body} onSubmit={submit}>
          <label className={styles.field}>
            <span>Group name</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lisbon trip" required maxLength={60} />
          </label>

          <label className={styles.field}>
            <span>Description <em>(optional)</em></span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this group for?" maxLength={140} />
          </label>

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
            <span className={styles.error} role="alert">{error}</span>
            <span className={styles.footerActions}>
              <Button type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving || !name.trim()}>{saving ? 'Creating…' : 'Create group'}</Button>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

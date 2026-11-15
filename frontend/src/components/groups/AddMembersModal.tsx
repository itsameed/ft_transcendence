import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { User } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import styles from './CreateGroupModal.module.css'

interface Props {
  open: boolean
  groupId: string
  groupName: string
  friends: User[]
  memberIds: string[]
  onClose: () => void
  onAdded: (users: User[]) => void
}

export function AddMembersModal({ open, groupId, groupName, friends, memberIds, onClose, onAdded }: Props) {
  const [picked, setPicked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
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

  const available = friends.filter((f) => !memberIds.includes(f.id))
  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (picked.length === 0) { setError('Pick at least one friend to add.'); return }
    setSaving(true)
    try {
      const added: User[] = []
      for (const userId of picked) {
        const res = await fetch(`/api/groups/${groupId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.message ?? 'Could not add a member.')
        const friend = friends.find((f) => f.id === userId)
        if (friend) added.push(friend)
      }
      onAdded(added)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add members.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="add-members-title">
        <header className={styles.header}>
          <h2 id="add-members-title">Add people to {groupName}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <form className={styles.body} onSubmit={submit}>
          <fieldset className={styles.friends}>
            <legend>Friends {picked.length > 0 ? `(${picked.length} selected)` : ''}</legend>
            {available.length === 0 ? (
              <p className={styles.empty}>
                {friends.length === 0
                  ? 'You have no friends yet — add friends from Groups & Friends first.'
                  : 'All of your friends are already in this group.'}
              </p>
            ) : (
              <ul className={styles.friendList}>
                {available.map((f) => (
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
              <Button type="submit" variant="primary" disabled={saving || picked.length === 0}>
                {saving ? 'Adding…' : picked.length > 1 ? `Add ${picked.length} people` : 'Add to group'}
              </Button>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

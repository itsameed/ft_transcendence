import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { logout } from '../../lib/auth'
import styles from './Sidebar.module.css'

/** Sidebar sign-out. Asks for confirmation so a stray click doesn't end the session. */
export function LogoutButton() {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    await logout()
  }

  if (!confirming) {
    return (
      <button type="button" className={styles.logout} onClick={() => setConfirming(true)}>
        <LogOut size={18} strokeWidth={1.75} aria-hidden />
        Log out
      </button>
    )
  }

  return (
    <div className={styles.logoutConfirm} role="group" aria-label="Confirm log out">
      <span>Log out of Splitify?</span>
      <span className={styles.logoutActions}>
        <button type="button" className={styles.logoutCancel} onClick={() => setConfirming(false)} disabled={busy}>
          Cancel
        </button>
        <button type="button" className={styles.logoutConfirmBtn} onClick={signOut} disabled={busy}>
          {busy ? 'Logging out…' : 'Log out'}
        </button>
      </span>
    </div>
  )
}

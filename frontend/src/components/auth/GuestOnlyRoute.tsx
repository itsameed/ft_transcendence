import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useAuthStatus } from '../../lib/useAuthStatus'
import styles from './GuestOnlyRoute.module.css'

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { status, retry } = useAuthStatus()
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/dashboard', { replace: true })
    }
  }, [status, navigate])

  if (status === 'unauthenticated') return children

  return (
    <main className={styles.page} role={status === 'error' ? 'alert' : 'status'}>
      <div className={styles.content}>
        {status === 'error' ? (
          <>
            <p>We couldn’t verify your sign-in status. Please try again.</p>
            <Button type="button" variant="primary" onClick={retry}>Try again</Button>
          </>
        ) : status === 'authenticated' ? (
          <p>Taking you to your dashboard…</p>
        ) : (
          <p>Checking your sign-in status…</p>
        )}
      </div>
    </main>
  )
}

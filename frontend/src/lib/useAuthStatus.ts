import { useCallback, useEffect, useState } from 'react'

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'error'

export function useAuthStatus() {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setStatus('checking')
    setAttempt((current) => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function checkAuth() {
      try {
        const response = await fetch('/api/session', {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Session check failed (${response.status}).`)
        }

        const { authenticated } = await response.json()
        setStatus(authenticated ? 'authenticated' : 'unauthenticated')
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Unable to check authentication status:', error)
        setStatus('error')
      }
    }

    void checkAuth()
    return () => controller.abort()
  }, [attempt])

  return { status, retry }
}

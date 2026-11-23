import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '../ui/Button'
import loginStyles from '../../pages/Login.module.css'
import styles from './TwoFactorStep.module.css'

interface Props {
  /** How the first factor was passed, for the subtitle. */
  method: 'password' | 'google'
  onSuccess: () => void
  /** The challenge is gone (expired, too many tries): back to the password step. */
  onRestart: (message?: string) => void
}

export function TwoFactorStep({ method, onSuccess, onRestart }: Props) {
  const [useRecovery, setUseRecovery] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const submitted = useRef('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [useRecovery])

  async function verify(raw: string) {
    if (loading) return
    setError(null)
    setLoading(true)
    submitted.current = raw
    try {
      const res = await fetch('/auth/login/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(useRecovery ? { recoveryCode: raw } : { code: raw }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        onSuccess()
        return
      }
      if (data.restart) {
        onRestart(data.message)
        return
      }
      setError(
        res.status === 429
          ? 'Too many attempts. Please wait 15 minutes and try again.'
          : data.message || 'That code didn’t work. Please try again.',
      )
      setValue('')
      inputRef.current?.focus()
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function onChange(next: string) {
    if (useRecovery) {
      setValue(next.slice(0, 11))
      return
    }
    const digits = next.replace(/\D/g, '').slice(0, 6)
    setValue(digits)
    // Submit as soon as the sixth digit lands (typed or pasted).
    if (digits.length === 6 && digits !== submitted.current) verify(digits)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (value) verify(value)
  }

  async function backToPassword() {
    await fetch('/auth/login/2fa/cancel', { method: 'POST' }).catch(() => undefined)
    onRestart()
  }

  const ready = useRecovery ? value.replace(/[^0-9a-f]/gi, '').length === 10 : value.length === 6

  return (
    <>
      <div className={loginStyles.header}>
        <span className={styles.badge} aria-hidden>
          <ShieldCheck size={20} aria-hidden />
        </span>
        <h1 className={loginStyles.title}>Two-step verification</h1>
        <p className={loginStyles.subtitle}>
          {useRecovery
            ? 'Enter one of the recovery codes you saved when you turned on two-step verification.'
            : method === 'google'
              ? 'Google signed you in. Now enter the 6-digit code from your authenticator app.'
              : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </div>

      <form className={loginStyles.form} onSubmit={onSubmit}>
        {error && <div className={loginStyles.errorAlert} role="alert">{error}</div>}

        <div className={loginStyles.field}>
          <label htmlFor="twofa-code">{useRecovery ? 'Recovery code' : 'Authentication code'}</label>
          <input
            ref={inputRef}
            id="twofa-code"
            name={useRecovery ? 'recovery-code' : 'one-time-code'}
            className={`${loginStyles.input} ${useRecovery ? styles.recoveryInput : styles.codeInput}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            inputMode={useRecovery ? 'text' : 'numeric'}
            autoComplete={useRecovery ? 'off' : 'one-time-code'}
            autoCapitalize="off"
            spellCheck={false}
            placeholder={useRecovery ? 'xxxxx-xxxxx' : '000000'}
            aria-describedby="twofa-hint"
            disabled={loading}
            required
          />
          <span id="twofa-hint" className={styles.hint}>
            {useRecovery ? 'Each recovery code works once.' : 'Codes refresh every 30 seconds.'}
          </span>
        </div>

        <Button type="submit" variant="primary" disabled={loading || !ready} className={loginStyles.submitBtn}>
          {loading ? 'Verifying…' : 'Verify'}
        </Button>
      </form>

      <div className={styles.links}>
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => {
            setUseRecovery((v) => !v)
            setValue('')
            setError(null)
            submitted.current = ''
          }}
        >
          {useRecovery ? 'Use your authenticator app' : 'Lost your phone? Use a recovery code'}
        </button>
        <button type="button" className={styles.linkBtn} onClick={backToPassword}>
          Back to sign in
        </button>
      </div>
    </>
  )
}

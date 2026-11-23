import { useEffect, useState, type FormEvent } from 'react'
import { Check, Copy, Download, ShieldCheck, ShieldOff } from 'lucide-react'
import { prefersFinePointer } from '../../lib/a11y'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import styles from './TwoFactorCard.module.css'

interface Status {
  enabled: boolean
  available: boolean
  hasPassword: boolean
  recoveryCodesLeft: number
}

type View =
  | { kind: 'idle' }
  | { kind: 'setup'; qrDataUrl: string; secret: string }
  | { kind: 'codes'; codes: string[] }
  | { kind: 'disable' }
  | { kind: 'regenerate' }

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      res.status === 429 ? 'Too many attempts. Please wait 15 minutes and try again.' : data.message || 'Something went wrong. Please try again.',
    )
  }
  return data as T
}

/** "6 digits" → authenticator code; anything else → recovery code. */
function factorBody(value: string) {
  const trimmed = value.replace(/\s+/g, '')
  return /^\d{6}$/.test(trimmed) ? { code: trimmed } : { recoveryCode: trimmed }
}

export function TwoFactorCard({ email }: { email: string }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [view, setView] = useState<View>({ kind: 'idle' })
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // Focus the field when a panel opens, but not on phones (it would pop the keyboard).
  const autoFocus = prefersFinePointer()

  useEffect(() => {
    fetch('/api/2fa')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setStatus)
      .catch(() => setLoadError(true))
  }, [])

  function go(next: View) {
    setView(next)
    setCode('')
    setPassword('')
    setError('')
    setNotice('')
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const startSetup = () =>
    run(async () => {
      const data = await post<{ qrDataUrl: string; secret: string }>('/api/2fa/setup')
      go({ kind: 'setup', ...data })
    })

  const confirmSetup = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      const data = await post<{ recoveryCodes: string[] }>('/api/2fa/enable', { code })
      setStatus((s) => s && { ...s, enabled: true, recoveryCodesLeft: data.recoveryCodes.length })
      go({ kind: 'codes', codes: data.recoveryCodes })
    })
  }

  const turnOff = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await post('/api/2fa/disable', { password, ...factorBody(code) })
      setStatus((s) => s && { ...s, enabled: false, recoveryCodesLeft: 0 })
      go({ kind: 'idle' })
      setNotice('Two-step verification is off.')
    })
  }

  const regenerate = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      const data = await post<{ recoveryCodes: string[] }>('/api/2fa/recovery-codes', { code: code.replace(/\s+/g, '') })
      setStatus((s) => s && { ...s, recoveryCodesLeft: data.recoveryCodes.length })
      go({ kind: 'codes', codes: data.recoveryCodes })
    })
  }

  if (loadError) {
    return <Card><p className={styles.muted}>Couldn’t load your two-step verification settings.</p></Card>
  }
  if (!status) {
    return <Card><p className={styles.muted} role="status">Loading…</p></Card>
  }

  return (
    <Card className={styles.card}>
      <div className={styles.summary}>
        <span className={styles.icon} data-on={status.enabled || undefined} aria-hidden>
          {status.enabled ? <ShieldCheck size={20} aria-hidden /> : <ShieldOff size={20} aria-hidden />}
        </span>
        <div className={styles.summaryText}>
          <strong>
            Authenticator app
            <span className={styles.pill} data-on={status.enabled || undefined}>{status.enabled ? 'On' : 'Off'}</span>
          </strong>
          <span>
            {status.enabled
              ? `Signing in asks for a code from your app. ${status.recoveryCodesLeft} of 10 recovery codes left.`
              : status.available
                ? 'Add a second step to sign-in with a code from an app like Google Authenticator, Authy or 1Password.'
                : 'Two-step verification isn’t available on this server yet.'}
          </span>
        </div>
        {view.kind === 'idle' && status.available && !status.enabled && (
          <Button type="button" variant="primary" onClick={startSetup} disabled={busy}>
            {busy ? 'Starting…' : 'Turn on'}
          </Button>
        )}
      </div>

      {view.kind === 'idle' && status.enabled && (
        <div className={styles.actions}>
          <Button type="button" size="sm" onClick={() => go({ kind: 'regenerate' })}>New recovery codes</Button>
          <Button type="button" size="sm" className={styles.danger} onClick={() => go({ kind: 'disable' })}>Turn off</Button>
        </div>
      )}

      {view.kind === 'setup' && (
        <form className={styles.panel} onSubmit={confirmSetup}>
          <ol className={styles.steps}>
            <li>
              <strong>Scan this QR code with your authenticator app</strong>
              <div className={styles.qrRow}>
                <img src={view.qrDataUrl} alt={`QR code to add Splitify (${email}) to your authenticator app`} className={styles.qr} width={168} height={168} />
                <div className={styles.manual}>
                  <span>Can’t scan it? Enter this key instead:</span>
                  <code className={styles.secret}>{view.secret.match(/.{1,4}/g)?.join(' ')}</code>
                  <CopyButton text={view.secret} label="Copy key" />
                </div>
              </div>
            </li>
            <li>
              <label className={styles.field}>
                <strong>Enter the 6-digit code it shows</strong>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className={styles.codeInput}
                  required
                  autoFocus={autoFocus}
                />
              </label>
            </li>
          </ol>
          <Footer error={error}>
            <Button type="button" variant="ghost" onClick={() => go({ kind: 'idle' })} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Turn on'}</Button>
          </Footer>
        </form>
      )}

      {view.kind === 'codes' && (
        <div className={styles.panel}>
          <div>
            <strong className={styles.panelTitle}>Save your recovery codes</strong>
            <p className={styles.muted}>
              If you lose your phone, each of these codes lets you sign in once. Keep them somewhere safe, like a password manager. You won’t see them again.
            </p>
          </div>
          <ul className={styles.codes}>
            {view.codes.map((c) => <li key={c}><code>{c}</code></li>)}
          </ul>
          <div className={styles.actions}>
            <CopyButton text={view.codes.join('\n')} label="Copy codes" />
            <Button
              type="button"
              size="sm"
              icon={<Download size={14} aria-hidden />}
              onClick={() => download(view.codes, email)}
            >
              Download
            </Button>
          </div>
          <Footer error="">
            <Button type="button" variant="primary" onClick={() => go({ kind: 'idle' })}>I’ve saved them</Button>
          </Footer>
        </div>
      )}

      {view.kind === 'disable' && (
        <form className={styles.panel} onSubmit={turnOff}>
          <p className={styles.muted}>Turning this off makes your account easier to break into. Confirm it’s you first.</p>
          {status.hasPassword && (
            <label className={styles.field}>
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required autoFocus={autoFocus} />
            </label>
          )}
          <label className={styles.field}>
            <span>Code from your app, or a recovery code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 11))}
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="000000"
              required
              autoFocus={autoFocus && !status.hasPassword}
            />
          </label>
          <Footer error={error}>
            <Button type="button" variant="ghost" onClick={() => go({ kind: 'idle' })} disabled={busy}>Cancel</Button>
            <Button type="submit" className={styles.danger} disabled={busy || !code}>{busy ? 'Turning off…' : 'Turn off'}</Button>
          </Footer>
        </form>
      )}

      {view.kind === 'regenerate' && (
        <form className={styles.panel} onSubmit={regenerate}>
          <p className={styles.muted}>Your old recovery codes will stop working. Enter a code from your authenticator app to continue.</p>
          <label className={styles.field}>
            <span>Code from your app</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={styles.codeInput}
              required
              autoFocus={autoFocus}
            />
          </label>
          <Footer error={error}>
            <Button type="button" variant="ghost" onClick={() => go({ kind: 'idle' })} disabled={busy}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={busy || code.length !== 6}>{busy ? 'Creating…' : 'Create new codes'}</Button>
          </Footer>
        </form>
      )}

      {view.kind === 'idle' && (error || notice) && (
        <p className={error ? styles.error : styles.notice} role={error ? 'alert' : 'status'}>{error || notice}</p>
      )}
    </Card>
  )
}

function Footer({ error, children }: { error: string; children: React.ReactNode }) {
  return (
    <div className={styles.footer}>
      <span className={styles.error} role="alert">{error}</span>
      <div className={styles.footerButtons}>{children}</div>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      size="sm"
      icon={copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        } catch {
          /* clipboard blocked: the text is still on screen to copy by hand */
        }
      }}
    >
      {copied ? 'Copied' : label}
    </Button>
  )
}

function download(codes: string[], email: string) {
  const body = [
    'Splitify recovery codes',
    `Account: ${email}`,
    `Created: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`,
    '',
    'Each code can be used once to sign in if you lose access to your authenticator app.',
    '',
    ...codes,
    '',
  ].join('\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'splitify-recovery-codes.txt'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Moon, Split, Sun } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { AvatarStep, type AvatarResult } from '../components/ui/AvatarStep'
import { Button } from '../components/ui/Button'
import { GoogleButton, OrDivider } from '../components/auth/GoogleButton'
import { Logo } from '../components/layout/Sidebar'
import { AVATAR_COLORS, getInitials, renderInitialsToFile } from '../lib/avatars'
import { isAbortError, uploadWithProgress, type UploadProgress } from '../lib/upload'
import styles from './Signup.module.css'

type Step = 1 | 2

export function Signup() {
   const navigate = useNavigate()
   const { dark, toggle } = useTheme()

   // ── Step state ───────────────────────────────────
   const [step, setStep] = useState<Step>(1)
   const [direction, setDirection] = useState<'forward' | 'back'>('forward')

   // ── Form fields ──────────────────────────────────
   const [username, setUsername] = useState('')
   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [passwordVisible, setPasswordVisible] = useState(false)
   const [error, setError] = useState<string | null>(null)
   const [loading, setLoading] = useState(false)
   const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
   const uploadAbort = useRef<AbortController | null>(null)

   useEffect(() => () => uploadAbort.current?.abort(), [])

   // Refs for native validation
   const credentialsFormRef = useRef<HTMLFormElement>(null)

   // ── Step navigation ──────────────────────────────
   const goToStep2 = useCallback(() => {
      setError(null)

      // Let the browser fire its built-in constraint validation UI
      if (!credentialsFormRef.current?.reportValidity()) return

      setDirection('forward')
      setStep(2)
   }, [])

   const goBackToStep1 = useCallback(() => {
      setError(null)
      setDirection('back')
      setStep(1)
   }, [])

   // ── Submit ───────────────────────────────────────
   const submitAccount = useCallback(async (avatarPayload: { file?: File; id?: string; showProgress?: boolean }) => {
      setError(null)
      setLoading(true)
      const controller = new AbortController()
      uploadAbort.current = controller
      const trackUpload = Boolean(avatarPayload.file && avatarPayload.showProgress)
      if (trackUpload) setUploadProgress({ loaded: 0, total: avatarPayload.file!.size, percent: 0, processing: false })

      try {
         const body = new FormData()
         body.append('username', username)
         body.append('email', email)
         body.append('password', password)
         if (avatarPayload.file) body.append('avatar', avatarPayload.file)
         else if (avatarPayload.id) body.append('avatar', avatarPayload.id)

         // XHR rather than fetch so a photo upload can report progress.
         const response = await uploadWithProgress<{ message?: string; email?: string }>('/auth/signup', body, {
            signal: controller.signal,
            onProgress: trackUpload ? setUploadProgress : undefined,
         })
         if (!response.ok) {
            setError(response.data?.message || 'Signup failed')
         } else {
            // The account can't sign in until the emailed link is clicked.
            navigate('/verify-email', { state: { email: response.data?.email ?? email } })
         }
      } catch (err) {
         if (isAbortError(err)) {
            setError('Upload cancelled. Your account was not created yet.')
         } else if (err instanceof Error) {
            console.error('Signup error:', err)
            setError(`An error occurred: ${err.message}`)
         } else {
            setError('An unexpected error occurred while signing up.')
         }
      } finally {
         uploadAbort.current = null
         setUploadProgress(null)
         setLoading(false)
      }
   }, [username, email, password, navigate])

   const handleAvatarSubmit = useCallback(async (avatar: AvatarResult) => {
      if (avatar.type === 'photo') {
         submitAccount({ file: avatar.file, showProgress: true })
      } else if (avatar.type === 'preset') {
         submitAccount({ id: avatar.id })
      } else {
         try {
            const file = await renderInitialsToFile(getInitials(username), avatar.colorId)
            submitAccount({ file })
         } catch {
            submitAccount({ id: avatar.colorId })
         }
      }
   }, [submitAccount, username])

   const handleSkip = useCallback(async () => {
      try {
         const file = await renderInitialsToFile(getInitials(username), AVATAR_COLORS[0].id)
         submitAccount({ file })
      } catch {
         submitAccount({ id: AVATAR_COLORS[0].id })
      }
   }, [submitAccount, username])

   // ── Shared animation class ───────────────────────
   const stepClass = direction === 'back' ? styles.stepBack : styles.step

   return (
      <div className={styles.authWrapper}>
         <header className={styles.topNav}>
            <Logo />
            <button
               type="button"
               className={styles.themeToggle}
               onClick={toggle}
               aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
               {dark ? <Sun size={18} strokeWidth={1.75} aria-hidden /> : <Moon size={18} strokeWidth={1.75} aria-hidden />}
            </button>
         </header>

         <main className={styles.content}>
            <div className={styles.card}>
               {/* ── Step 1: Credentials ─────────────────── */}
               {step === 1 && (
                  <div className={stepClass} key="step-1">
                     {/* Header */}
                     <div className={styles.header}>
                        <span className={styles.brandMark} aria-hidden="true">
                           <Split size={18} strokeWidth={2.2} aria-hidden />
                        </span>
                        <h1 className={styles.title}>Create an account</h1>
                        <p className={styles.subtitle}>Get started tracking and settling group balances</p>
                     </div>

                     <GoogleButton label="Sign up with Google" compact />
                     <OrDivider label="or continue with email" />

                     <form
                        ref={credentialsFormRef}
                        className={styles.form}
                        onSubmit={(e) => { e.preventDefault(); goToStep2() }}
                     >
                        {error && <div className={styles.errorAlert} role="alert">{error}</div>}

                        <div className={styles.field}>
                           <label htmlFor="username">Username</label>
                           <input
                              type="text"
                              id="username"
                              name="username"
                              autoComplete="username"
                              autoCapitalize="none"
                              spellCheck={false}
                              className={styles.input}
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="alex…"
                              maxLength={40}
                              required
                           />
                        </div>

                        <div className={styles.field}>
                           <label htmlFor="email">Email</label>
                           <input
                              type="email"
                              id="email"
                              name="email"
                              autoComplete="email"
                              spellCheck={false}
                              className={styles.input}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="alex@example.com…"
                              required
                           />
                        </div>

                        <div className={styles.field}>
                           <label htmlFor="password">Password</label>
                           <div className={styles.passwordInputWrap}>
                              <input
                                 type={passwordVisible ? 'text' : 'password'}
                                 id="password"
                                 name="password"
                                 autoComplete="new-password"
                                 className={`${styles.input} ${styles.passwordInput}`}
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 placeholder="At least 8 characters"
                                 minLength={8}
                                 required
                                 aria-describedby="passwordHint"
                              />
                              <button
                                 type="button"
                                 className={styles.passwordToggle}
                                 onClick={() => setPasswordVisible((visible) => !visible)}
                                 aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                                 aria-pressed={passwordVisible}
                              >
                                 {passwordVisible ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                              </button>
                           </div>
                           <p id="passwordHint" className={styles.passwordHint}>
                              At least 8 characters
                           </p>
                        </div>

                        <Button
                           type="submit"
                           variant="primary"
                           className={styles.submitBtn}
                        >
                           Continue to avatar
                        </Button>

                        <p className={styles.legalNotice}>
                           By creating an account, you agree to the{' '}
                           <Link to="/terms" className={styles.policyLink}>Terms of Service</Link>
                           {' '}and{' '}
                           <Link to="/privacy" className={styles.policyLink}>Privacy Policy</Link>
                        </p>
                     </form>

                     <p className={styles.footer}>
                        Already have an account?{' '}
                        <Link to="/login" className={styles.link}>
                           Sign in
                        </Link>
                     </p>
                  </div>
               )}

               {/* ── Step 2: Avatar & Finish ─────────────── */}
               {step === 2 && (
                  <div key="step-2">
                     {/* Step indicator */}
                     <div className={styles.stepIndicator}>
                        <span className={styles.stepDot} />
                        <span className={`${styles.stepDot} ${styles.stepDotActive}`} />
                        <span>Step 2 of 2</span>
                     </div>

                     <button
                        type="button"
                        className={styles.backBtn}
                        onClick={goBackToStep1}
                     >
                        <ArrowLeft size={15} aria-hidden />
                        Back
                     </button>

                     <AvatarStep
                        username={username}
                        onSubmit={handleAvatarSubmit}
                        onSkip={handleSkip}
                        loading={loading}
                        error={error}
                        uploadProgress={uploadProgress}
                        onCancelUpload={() => uploadAbort.current?.abort()}
                     />
                  </div>
               )}
            </div>
         </main>
      </div>
   )
}

export default Signup

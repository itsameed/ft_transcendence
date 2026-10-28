import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Sidebar'
import styles from './Signup.module.css'

export function Signup() {
   const navigate = useNavigate()
   const { dark, toggle } = useTheme()
   const [username, setUsername] = useState('')
   const [fullname, setFullname] = useState('')
   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [confirmPassword, setConfirmPassword] = useState('')
   const [error, setError] = useState<string | null>(null)
   const [loading, setLoading] = useState(false)


   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      if (password !== confirmPassword) {
         setError('Passwords do not match')
         setLoading(false)
         return
      }

      try {
         const response = await fetch('/auth/signup', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fullName: fullname, username, email, password }),
         })
         const data = await response.json()
         if (!response.ok) {
            setError(data.message || 'Signup failed')
         } else {
            console.log('Signup successful:', data)
            navigate('/login')
         }
      } catch (err) {
         console.error('Signup error:', err)
         if (err instanceof Error) {
            setError(`An error occurred: ${err.message}`)
         } else {
            setError('An unexpected error occurred while signing up.')
         }
      } finally {
         setLoading(false)
      }
   }

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
               {dark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
            </button>
         </header>

         <main className={styles.content}>
            <div className={styles.card}>
               <div className={styles.header}>
                  <h1 className={styles.title}>Create an account</h1>
                  <p className={styles.subtitle}>Get started tracking and settling group balances</p>
               </div>

               <form className={styles.form} onSubmit={handleSubmit}>
                  {error && <div className={styles.errorAlert}>{error}</div>}

                  <div className={styles.grid}>
                     <div className={styles.field}>
                        <label htmlFor="fullname">Full name</label>
                        <input
                           type="text"
                           id="fullname"
                           name="fullname"
                           className={styles.input}
                           value={fullname}
                           onChange={(e) => setFullname(e.target.value)}
                           placeholder="Alex Rivera"
                           required
                        />
                     </div>

                     <div className={styles.field}>
                        <label htmlFor="username">Username</label>
                        <input
                           type="text"
                           id="username"
                           name="username"
                           className={styles.input}
                           value={username}
                           onChange={(e) => setUsername(e.target.value)}
                           placeholder="alex"
                           required
                        />
                     </div>
                  </div>

                  <div className={styles.field}>
                     <label htmlFor="email">Email</label>
                     <input
                        type="email"
                        id="email"
                        name="email"
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        required
                     />
                  </div>

                  <div className={styles.grid}>
                     <div className={styles.field}>
                        <label htmlFor="password">Password</label>
                        <input
                           type="password"
                           id="password"
                           name="password"
                           className={styles.input}
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           placeholder="••••••••"
                           required
                        />
                     </div>

                     <div className={styles.field}>
                        <label htmlFor="confirmPassword">Confirm</label>
                        <input
                           type="password"
                           id="confirmPassword"
                           name="confirmPassword"
                           className={styles.input}
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           placeholder="••••••••"
                           required
                        />
                     </div>
                  </div>

                  <Button
                     type="submit"
                     variant="primary"
                     disabled={loading}
                     className={styles.submitBtn}
                  >
                     {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
               </form>

               <p className={styles.footer}>
                  Already have an account?{' '}
                  <Link to="/login" className={styles.link}>
                     Sign in
                  </Link>
               </p>
            </div>
         </main>
      </div>
   )
}

export default Signup
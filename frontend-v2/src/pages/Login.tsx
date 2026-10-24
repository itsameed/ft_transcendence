import styles from './Login.module.css';
import { useTheme } from '../lib/useTheme';
import { useState } from 'react';
import { Link, useNavigate} from 'react-router-dom'

export function Login() {
  const { dark, toggle } = useTheme();
    const [handler, setHandler] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Handle login logic here
        console.log('Submitted credentials:', { handler, password });
        setError(null);
        setLoading(true);

        try{
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: handler, password })
            });
            const data = await response.json();
            if(!response.ok){
                setError(data.message || 'Login failed');
            } else {
                console.log('Login successful:', data);
                navigate("/Dashboard")
            }
        } catch (error) {
            console.log('Login error: ', error);
            if (error instanceof Error) {
                setError(`An error occurred: ${error.message}`);
            } else {
                setError('An unexpected error occurred while logging in.');
            }
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className={`${styles.login} ${dark ? styles.dark : styles.light}`}>
      <h1>Login Page</h1>
      <button onClick={toggle}>
        Switch to {dark ? 'Light' : 'Dark'} Mode
      </button>

      <div className={styles.formContainer}>
        <form className={styles.form} onSubmit={handleSubmit}>
            { error && <div className={styles.error}>{error}</div> }
            {/* { loading && <div className={styles.loading}>Loading...</div> } */}
          <label htmlFor="handler">Username or Email:</label>
          <input type="text" id="handler" name="handler"  value={handler} onChange={(e) =>setHandler(e.target.value)} required />

          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password"  value={password} onChange={(e) =>setPassword(e.target.value)} required />

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p>Don't have an account? <Link to="/signup">sign up</Link></p>
        </form>
      </div>
    </div>
  );
}

export default Login;

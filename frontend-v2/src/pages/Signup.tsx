import styles from './Login.module.css';
import { useTheme } from '../lib/useTheme';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Signup() {
    const navigate = useNavigate();
    const { dark, toggle } = useTheme();
    const [username, setUsername] = useState('');
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Handle signup logic here
        console.log('Submitted credentials:', {fullname, email, username, password, confirmPassword });
        setError(null);
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName: fullname, username, email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.message || 'Signup failed');
            } else {
                console.log('Signup successful:', data);
                // Redirect or update state as needed
                navigate("/Dashboard");
            }
        } catch (error) {
            console.log('signup error: ', error);
            setError('An error occurred while signing up.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className={`${styles.signup} ${dark ? styles.dark : styles.light}`}>
            <h1>Signup Page</h1>
            <button onClick={toggle}>
                Switch to {dark ? 'Light' : 'Dark'} Mode
            </button>

            <div className={styles.formContainer}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    {error && <div className={styles.error}>{error}</div>}
                    {/* {loading && <div className={styles.loading}>Loading...</div>} */}
                    <label htmlFor="fullname">Full name:</label>
                    <input type="text" id="full name" name="full name" value={fullname} onChange={(e) => setFullname(e.target.value)} required />
                    
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    
                    <label htmlFor="email">Email:</label>
                    <input type="text" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing up...' : 'Signup'}
                    </button>
                </form>
            </div>
        </div>
    );
}
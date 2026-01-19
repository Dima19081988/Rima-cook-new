import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const success = await authApi.login(password);
        if (success) {
            navigate('/admin', { replace: true });
        } else {
            setError('❌ Неверный пароль');
        }
        setLoading(false);
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginCard}>
                <h1>Моя кухня</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        placeholder="введите пароль"
                        disabled={loading}               
                    />
                    {error && <div className={styles.error}>{error}</div>}
                    <button
                        type="submit"
                        disabled={loading || !password}
                        className={styles.submit}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
}
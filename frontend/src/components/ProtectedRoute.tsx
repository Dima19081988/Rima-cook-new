import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authApi } from "../api/auth";
import styles from './ProtectedRoute.module.css';

export default function ProtectedRoute() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const auth = await authApi.checkAuth();
                setIsAuthenticated(auth);
            } catch (error) {
                console.error('Auth error: ', error);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        verifyAuth();
    }, []);

    if (loading) {
        return <div className={styles.auth_loading}>Проверка пароля...</div>
    }

    return isAuthenticated ? (
        <Outlet />
    ) : (
        <Navigate to="/admin/login" replace state={{ from: location }} />
    );
}
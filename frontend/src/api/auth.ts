import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({ 
    baseURL: API_BASE,
    withCredentials: true
 });

export const authApi = {
    checkAuth: async (): Promise<boolean> => {
        try {
            const res = await api.get('/auth/check');
            return res.data.authenticated;
        } catch {
            return false;
        }
    },

    login: async (password: string): Promise<boolean> => {
        try {
            const res = await api.post('/auth/login', { password });
            return res.data.success;
        } catch {
            return false;
        }
    },

    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } catch {
            ///
        }
    }
};
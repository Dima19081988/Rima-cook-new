import { Router } from "express";
import * as bcrypt from 'bcryptjs';
import rateLimit from "express-rate-limit";

interface AuthSession {
    isAdmin?: boolean;
}

const router = Router();

const authLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 10,                
    message: { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', authLimiter, async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Пароль обязателен' });
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash) {
        return res.status(400).json({ error: 'Ошибка сервера' });
    }

    const isValid = await bcrypt.compare(password, hash);
    if (isValid) {
        (req.session as AuthSession).isAdmin = true;  
        return res.json({ success: true });
    } else {
        return res.status(401).json({ error: 'Неверный пароль' });
    }
});

router.get('/check', (req, res) => {
    const session = req.session as AuthSession;
    res.json({ authenticated: session.isAdmin || false });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Ошибка выхода' });
        res.json({ success: true });
    });
});

export default router;
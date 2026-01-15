import type { Request, Response, NextFunction } from "express";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!authHeader || !adminKey || authHeader !== `Bearer ${adminKey}`) {
        return res.status(401).json({ error: 'Доступ запрещён. Требуется авторизация.' });
    }

    next();
};
import type { Request, Response, NextFunction } from "express";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    console.log('🔍 Session:', req.session);
    
    const session = req.session as unknown as { isAdmin?: boolean };
    
    if (!session.isAdmin) {
        return res.status(401).json({ error: 'Не авторизован' });
    }
    
    next();
};
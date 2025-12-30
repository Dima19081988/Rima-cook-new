import { Router } from "express";
import { RecipeService } from "../services/recipeService.js";
import type { HomeData } from "../models/types/index.js";

const router = Router();

router.get('/', async (req, res) => {
    try {
        const homeData: HomeData = await RecipeService.getHomeData();
        res.json(homeData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при загрузке домашней страницы' })
    }
});

export default router;
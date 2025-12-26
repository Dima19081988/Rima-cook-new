import { Router } from "express";
import { RecipeService } from "../services/recipeService.js";

const router = Router();

router.get('/', async (req, res) => {
    try {
        const recipes = await RecipeService.getAll();
        res.json(recipes)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при загрузке рецептов' })
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const recipe = await RecipeService.getBySlug(req.params.slug);
        if (!recipe) {
             return res.status(404).json({ error: 'Рецепт не найден' });
        }
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при загрузке рецепта' });
    }
});

export default router;
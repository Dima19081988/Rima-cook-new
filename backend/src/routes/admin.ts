import { Router } from "express";
import { RecipeService } from "../services/recipeService.js";
import type { CreateRecipeData, UpdateRecipeData } from "../models/types/index.js";

const router = Router();

router.get('/recipes', async (req, res) => {
    try {
        const recipes = await RecipeService.getAllAdmin();
        res.json(recipes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка загрузки рецептов' });
    }
});

router.post('/recipes', async (req, res) => {
    try {
        const recipeData: CreateRecipeData = req.body;
        const recipe = await RecipeService.create(recipeData);
        res.status(201).json({ message: '✅ Рецепт создан!', recipe });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Ошибка создания рецепта' });
    }
});

router.put('/recipes/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data: UpdateRecipeData = req.body;
        const recipe = await RecipeService.update(id, data);
        res.json({ message: '✅ Обновлено!', recipe });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Ошибка обновления рецепта' });
    }
});

router.delete('/recipes/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await RecipeService.delete(id);
        if (deleted) {
            res.json({ message: '✅ Удалено!' });
        } else {
            res.status(404).json({ error: 'Рецепт не найден' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления рецепта' });
    }
});

export default router;
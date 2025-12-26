import { Router } from "express";
import { CategoryService } from "../services/categoryService.js";  


const router = Router();

router.get('/', async (req, res) => {
    try {
        const categories = await CategoryService.getAllCategories();
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при загрузки категорий' })
    } 
});

export default router;
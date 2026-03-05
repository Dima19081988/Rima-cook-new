import { Router } from "express";
import type { Request, Response } from "express"
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { RecipeService } from "../services/recipeService.js";
import { uploadToS3 } from "../services/s3.js";
import type { CreateRecipeData, UpdateRecipeData } from "../models/types/index.js";
import { CategoryService } from "../services/categoryService.js";

declare module 'express-serve-static-core' {
    interface Request {
        files: Express.Multer.File[] | undefined;
    }
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/categories', async (req, res) => {
    try {
        const categories = await CategoryService.getAllCategories();
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка загрузки категорий' });
    }
});

router.use(requireAuth);

router.get('/recipes', async (req, res) => {
    try {
        const recipes = await RecipeService.getAllAdmin();
        res.json(recipes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка загрузки рецептов' });
    }
});

router.get('/recipes/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const recipe = await RecipeService.getById(id);
        if (!recipe) {
            return res.status(404).json({ error: 'Рецепт не найден' });
        }
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка загрузки рецепта' });
    }
});

router.post('/recipes', upload.single('image'), async (req, res) => {
    try {
        console.log('POST req.body:', req.body);
        console.log('POST req.file:', req.file);

        const categoryIds = req.body['category_ids[]'] ?
            Array.isArray(req.body['category_ids[]']) 
                ? req.body['category_ids[]'].map(Number)
                : [parseInt(req.body['category_ids[]'])]
            : [];

        let imageUrl: string | undefined;
        if (req.file) {
            imageUrl = await uploadToS3(
                req.file.buffer,
                req.file.originalname || 'image.jpg',
            );
            console.log('POST S3 URL:', imageUrl);
        }
        
        
        const recipeData: CreateRecipeData = {
            title: req.body.title as string,
            slug: req.body.slug as string,
            description: req.body.description as string || undefined,
            cooking_time: req.body.cooking_time as string || undefined,
            servings: req.body.servings ? parseInt(req.body.servings as string) : undefined,
            difficulty: ['easy', 'medium', 'hard'].includes(req.body.difficulty as string) 
                ? (req.body.difficulty as 'easy' | 'medium' | 'hard') 
                : 'medium',
            category_ids: categoryIds,
            image_url: imageUrl,
            steps: req.body.steps as string || '[]'
        }

        console.log('POST FINAL DATA:', recipeData);
        const recipe = await RecipeService.create(recipeData);
        console.log('POST DB CREATED:', recipe);
        res.status(201).json({ message: '✅ Рецепт создан!', recipe });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Ошибка создания рецепта' });
    }
});

router.put('/recipes/:id', upload.single('image'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        console.log('req.body:', req.body);
        console.log('req.file:', req.file);

        const categoryIds = req.body['category_ids[]'] ? 
            Array.isArray(req.body['category_ids[]']) 
                ? req.body['category_ids[]'].map(Number) 
                : [parseInt(req.body['category_ids[]'])]
            : [];

        let imageUrl: string | undefined;
        if (req.file) {
            imageUrl = await uploadToS3(
                req.file.buffer,
                req.file.originalname || 'image.jpg', 
                id
            );
            console.log('S3 URL:', imageUrl);
        } else {
            console.log('ℹ️ Новое фото не загружено, оставляем старое');
        }

        const data: UpdateRecipeData = {
            title: req.body.title as string,
            slug: req.body.slug as string,
            description: (req.body.description as string) || undefined,
            cooking_time: (req.body.cooking_time as string) || undefined,
            servings: req.body.servings ? parseInt(req.body.servings as string) : undefined,
            difficulty: ['easy', 'medium', 'hard'].includes(req.body.difficulty as string) 
                ? (req.body.difficulty as 'easy' | 'medium' | 'hard') 
                : 'medium',
            category_ids: categoryIds,
            image_url: imageUrl,
            steps: (req.body.steps as string) || '[]'
        };
        console.log('FINAL DATA:', data);

        const recipe = await RecipeService.update(id, data);
        console.log('DB UPDATED:', recipe);
        res.json({ message: '✅ Обновлено!', recipe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка обновления рецепта' });
    }
});

router.post('/recipes/:id/images', upload.array('images', 10), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        console.log('Multiple images:', req.files?.length);
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Файлы обязательны' });
        }

        const imageUrls: string[] = await Promise.all(
            req.files.map((file: Express.Multer.File) => 
                uploadToS3(file.buffer, file.originalname || 'image.jpg', id)
            )
        );

        await Promise.all(
            imageUrls.map((url: string) => 
                RecipeService.addImage(id, url)
            )
        );

        const recipe = await RecipeService.getByIdFull(id);
        res.json({ message: `✅ Добавлено ${imageUrls.length} фото!`, recipe });
    } catch (error) {
        console.error('❌ Add images error:', error);
        res.status(500).json({ error: 'Ошибка добавления фото' });
    }
});

router.post('/recipes/:id/step-images', upload.array('step-images', 20), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log('🖼️ Step images:', req.files?.length);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "Файлы обязательны" });
        }

        const imageUrls: string[] = await Promise.all(
            req.files.map((file: Express.Multer.File, index: number) => 
                uploadToS3(file.buffer, `${id}-step-${index}.jpg`, id)
            )
        );

        await Promise.all(
            imageUrls.map((url) => RecipeService.addImage(id, url))
        );

        const recipe = await RecipeService.getByIdFull(id);
        res.json({ message: `✅ Добавлено ${imageUrls.length} фото шагов!`, recipe });

    } catch (error) {
        console.error('Step images error:', error);
        res.status(500).json({ error: 'Ошибка добавления фото шагов' });
    }
});

router.delete('/recipes/:recipeId/images/:imageId', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.recipeId);
        const imageId = parseInt(req.params.imageId);
        
        const success = await RecipeService.deleteImageById(recipeId, imageId);
        
        if (success) {
            console.log(`🗑️ Удалено изображение ${imageId} из рецепта ${recipeId}`);
            res.json({ success: true, message: 'Фото шага удалено!' });
        } else {
            res.status(404).json({ error: 'Изображение не найдено' });
        }
    } catch (error) {
        console.error('Ошибка удаления изображения:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
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
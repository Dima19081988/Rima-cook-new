import { db } from "../config/db.js";
import type { HomeData, Recipe, CategoryPreview, CreateRecipeData, UpdateRecipeData, RecipeFull, RecipeImage, RecipeStep } from "../models/types/index.js";
import { s3Client } from "../services/s3.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3"; 

export class RecipeService {
    // 🏠 Главная страница
    static async getHomeData(): Promise<HomeData> {
        return {
            popular: await this.getPopular(6),
            categories: await this.getCategoriesWithPreview()
        };
    }

    // ⭐ Популярные (новые + просмотры)
    static async getPopular(limit: number = 6): Promise<Recipe[]> {
        const result = await db.query(`
            SELECT r.*, COALESCE(v.view_count, 0) as popularity_score
            FROM recipes r
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) as view_count 
                FROM recipe_views 
                GROUP BY recipe_id
            ) v ON r.id = v.recipe_id
            ORDER BY popularity_score DESC NULLS LAST, r.created_at DESC
            LIMIT $1
            `, [limit]);
        return result.rows as Recipe[];
    }

    static async getCategoriesWithPreview(): Promise<CategoryPreview[]> {
        const result = await db.query(`
            SELECT 
                c.id, c.name, c.slug, c.color,
                array_remove(array_agg(r.id ORDER BY r.created_at DESC), NULL) as recipe_ids
            FROM categories c
            LEFT JOIN recipe_categories rc ON c.id = rc.category_id
            LEFT JOIN recipes r ON rc.recipe_id = r.id
            GROUP BY c.id, c.name, c.slug, c.color
            ORDER BY c.name
            `);
        return result.rows as CategoryPreview[];
    }

    static async getAll(): Promise<Recipe[]> {
        const result = await db.query('SELECT * FROM recipes ORDER BY created_at DESC');
        return result.rows as Recipe[];
    }

    static async getBySlug(slug: string): Promise<Recipe | null> {
        const result = await db.query('SELECT * FROM recipes WHERE slug = $1', [slug]);
        return result.rows[0] as Recipe | null;
    }

    static async create(data: CreateRecipeData): Promise<Recipe> {
        console.log('CREATE DATA:', data);
        console.log('📥 Получено steps (сырое):', data.steps);
        let stepsData: RecipeStep[] = [];
        if (data.steps) {
            try {
                stepsData = JSON.parse(data.steps) as RecipeStep[];
                console.log('Шаги распарсены', stepsData);
            } catch (error) {
                console.warn('Ошибка парсинга шагов', error);
            }
        }

        const result = await db.query(`
            INSERT INTO recipes (title, slug, description, cooking_time, servings, difficulty, image_url, steps)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                data.title,
                data.slug,
                data.description || null,
                data.cooking_time || null,
                data.servings || 4,
                data.difficulty || 'medium',
                data.image_url || null,
                stepsData
            ]
        );

        const recipeId: number = result.rows[0].id

        if (data.category_ids && data.category_ids.length > 0 ) {
            const categoryInserts = data.category_ids.map(catId => 
                db.query(
                    'INSERT INTO recipe_categories (recipe_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [recipeId, catId]
                )
            );
            await Promise.all(categoryInserts);
        }

        console.log('CREATE SAVED:', result.rows[0]);
        return result.rows[0] as Recipe;
    }

    static async update(id: number, data: UpdateRecipeData): Promise<Recipe> {
        console.log('🔍 SERVICE UPDATE DATA:', data); 

        const currentRecipe = await db.query(
            'SELECT image_url FROM recipes WHERE id = $1', 
            [id]
        );
        const oldImageUrl = currentRecipe.rows[0]?.image_url;

        const finalImageUrl = data.image_url !== undefined ? data.image_url : oldImageUrl;

        if (data.image_url && oldImageUrl && data.image_url !== oldImageUrl) {
            try {
                const bucket = process.env.YANDEX_S3_BUCKET!;
                const key = oldImageUrl.includes(bucket)
                    ? oldImageUrl.replace(`https://${bucket}.storage.yandexcloud.net/`, '')
                    : oldImageUrl.split('/').slice(3).join('/');
                
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: key
                }));
                console.log(`🗑️ S3: удалено старое главное фото ${key}`);
            } catch (error) {
                console.error('⚠️ Ошибка удаления старого фото из S3:', error);

            }
        }

        await db.query('DELETE FROM recipe_categories WHERE recipe_id = $1', [id]);
        if (data.category_ids && data.category_ids.length > 0) {
            const categoryInserts = data.category_ids.map(catId => 
                db.query(
                    'INSERT INTO recipe_categories (recipe_id, category_id) VALUES ($1, $2)',
                    [id, catId]
                )
            );
            await Promise.all(categoryInserts);
        }

        let stepsData: RecipeStep[] = [];
        if (data.steps) {
            try {
                stepsData = JSON.parse(data.steps) as RecipeStep[];
                console.log('Шаги распарсены', stepsData);
            } catch (error) {
                console.warn('Ошибка парсинга шагов', error);
            }
        }

        const result = await db.query(`
            UPDATE recipes 
            SET 
                title = $1,
                slug = $2,
                description = $3,
                cooking_time = $4,
                servings = $5,
                difficulty = $6,
                image_url = $7,
                steps = $8,
                updated_at = NOW()
            WHERE id = $9 
            RETURNING *`,
        [
            data.title || null,
            data.slug || null,
            data.description || null,
            data.cooking_time || null,
            data.servings || null,
            data.difficulty || 'medium',
            finalImageUrl, 
            stepsData,
            id
        ]);

        console.log('✅ SERVICE UPDATED:', result.rows[0]);
        return result.rows[0] as Recipe;
    }

    static async delete(id: number): Promise<boolean> {
        try {
            const imagesResult = await db.query(
                'SELECT image_url FROM recipe_images WHERE recipe_id = $1', 
                [id]
            );

            const recipeResult = await db.query(
                'SELECT image_url FROM recipes WHERE id = $1',
                [id]
            );
            
            const bucket = process.env.YANDEX_S3_BUCKET!;
            const allUrls: string[] = [];
            if (recipeResult.rows[0]?.image_url) {
                allUrls.push(recipeResult.rows[0].image_url);
            }
            allUrls.push(...imagesResult.rows.map((r: {image_url: string}) => r.image_url));
            const deletePromises = allUrls.map(async (url) => {
                try {
                    const key = url.includes(bucket)
                        ? url.replace(`https://${bucket}.storage.yandexcloud.net/`, '')
                        : url.split('/').slice(3).join('/');
                        
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: bucket,
                        Key: key
                    }));
                    console.log(`🗑️ S3: удалён ${key}`);
                } catch (s3Error) {
                    console.error(`⚠️ Не удалился файл из S3: ${url}`, s3Error);
                } 
            });

            await Promise.all(deletePromises);
            
            await db.query('DELETE FROM recipe_categories WHERE recipe_id = $1', [id]);
            await db.query('DELETE FROM recipe_images WHERE recipe_id = $1', [id]);
            
            const result = await db.query('DELETE FROM recipes WHERE id=$1 RETURNING id', [id]);
            console.log(`✅ Рецепт ${id} полностью удалён (БД + S3)`);
            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            console.error(`❌ Ошибка удаления рецепта ${id}:`, error);
            throw error;
        }
    }

    static async getAllAdmin(): Promise<Recipe[]> {
        const result = await db.query(`
            SELECT 
                r.*, 
                COALESCE(array_agg(c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as categories,
                COUNT(ri.id) as image_count
            FROM recipes r
            LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
            LEFT JOIN categories c ON rc.category_id = c.id
            LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
            GROUP BY r.id, r.title, r.slug, r.description, r.cooking_time, 
                    r.servings, r.difficulty, r.image_url, r.created_at, r.updated_at
            ORDER BY r.created_at DESC
        `);
        return result.rows as Recipe[];
    }

    static async getById(id: number): Promise<RecipeFull | null> {
        const result = await db.query(`
            SELECT 
                r.*, 
                COALESCE(array_agg(c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as categories,
                COALESCE(json_agg(json_build_object(
                    'id', ri.id,
                    'recipe_id', ri.recipe_id,
                    'image_url', ri.image_url,
                    'sort_order', ri.sort_order,
                    'created_at', ri.created_at
                )) FILTER (WHERE ri.id IS NOT NULL), '[]') as images,
                COALESCE(r.steps, '[]'::jsonb) as steps
            FROM recipes r
            LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
            LEFT JOIN categories c ON rc.category_id = c.id
            LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
            WHERE r.id = $1
            GROUP BY r.id, r.steps`, [id]);

        if (result.rows.length === 0) {
            return null; 
        }
        
        const recipe = result.rows[0] as RecipeFull;
        recipe.images = (recipe.images as RecipeImage[]) || [];
        recipe.steps = (recipe.steps as RecipeStep[]) || [];
        
        return recipe;
    }

    static async getByIdFull(id: number): Promise<RecipeFull | null> {
        const recipe = await this.getById(id);
        if (!recipe) return null;

        const imageResult = await db.query(
            `SELECT * FROM recipe_images
             WHERE recipe_id = $1
             ORDER BY sort_order ASC, created_at ASC`
            , [id]
        );

        return {
            ...recipe,
            images: imageResult.rows as RecipeImage[]
        };
    }
    
    static async addImage(recipeId: number, imageUrl: string): Promise<void> {
        const maxOrderResult = await db.query(
            `SELECT COALESCE(MAX(sort_order), 0) as max_order
            FROM recipe_images
            WHERE recipe_id = $1`,
            [recipeId]
        );

        const nextOrder = (maxOrderResult.rows[0].max_order as number) + 1;

        await db.query(
            `INSERT INTO recipe_images (recipe_id, image_url, sort_order)
            VALUES ($1, $2, $3)`,
            [recipeId, imageUrl, nextOrder]
        );
    }

    static async deleteImageById(recipeId: number, imageId: number): Promise<boolean> {
        const imageResult = await db.query(
            'SELECT image_url FROM recipe_images WHERE recipe_id = $1 AND id = $2', [recipeId, imageId]);

            if (imageResult.rows.length === 0) {
                return false;
            }

            const imageUrl = imageResult.rows[0].image_url;

            try {
                const bucket = process.env.YANDEX_S3_BUCKET!;
                const key = imageUrl.replace(`https://${bucket}.storage.yandexcloud.net/`, '');
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: key,
                }));
            } catch (error) {
                console.error('Error deleting image from S3:', error);
            }

        const result = await db.query(
            'DELETE FROM recipe_images WHERE recipe_id = $1 AND id = $2 RETURNING id', 
            [recipeId, imageId]
        );
        return result.rowCount! > 0;
    }
}
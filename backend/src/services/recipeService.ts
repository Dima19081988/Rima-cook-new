import { db } from "../config/db.js";
import type { HomeData, Recipe, CategoryPreview, CreateRecipeData, UpdateRecipeData } from "../models/types/index.js";

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
        const result = await db.query(`
            INSERT INTO recipes (title, slug, description, cooking_time, servings, difficulty)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                data.title,
                data.slug,
                data.description || null,
                data.cooking_time || null,
                data.servings || 4,
                data.difficulty || 'medium'
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
        return result.rows[0] as Recipe;
    }

    static async update(id: number, data: UpdateRecipeData): Promise<Recipe> {
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
        const updates: string[] = [];
        const values: unknown[] = [id];
        let paramIndex = 2;

        if (data.title) {
            updates.push(`title = $${paramIndex}`);
            values.push(data.title);
            paramIndex++;
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            values.push(data.description);
            paramIndex++;
        }
        if (data.cooking_time) {
            updates.push(`cooking_time = $${paramIndex}`);
            values.push(data.cooking_time);
            paramIndex++;
        }
        if (data.servings !== undefined) {
            updates.push(`servings = $${paramIndex}`);
            values.push(data.servings);
            paramIndex++;
        }
        if (data.difficulty) {
            updates.push(`difficulty = $${paramIndex}`);
            values.push(data.difficulty);
            paramIndex++;
        }

        const result = await db.query(
            `UPDATE recipes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            values 
        );

        return result.rows[0] as Recipe;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM recipes WHERE id=$1 RETURNING id', [id]);
        return (result.rowCount ?? 0) > 0;
    }

    static async getAllAdmin(): Promise<Recipe[]> {
        const result = await db.query(`
            SELECT r.*, array_agg(c.name) as categories
            FROM recipes r
            LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
            LEFT JOIN categories c ON rc.category_id = c.id
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `);
        return result.rows as Recipe[];
    }
}
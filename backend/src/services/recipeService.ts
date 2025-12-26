import { db } from "../config/db.js";
import type { HomeData, Recipe, CategoryPreview } from "../models/types/recipe.js";

export class RecipeService {
    // 🏠 Главная страница
    static async getHomeData(): Promise<HomeData> {
        return {
            popular: await this.getPopular(6),
            category: await this.getCategoriesWithPreview()
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
        return result.rows as Recipe[]
    }

    static async getBySlug(slug: string): Promise<Recipe[] | null> {
        const result =await db.query('SELECT * FROM recipes WHERE slug=$1', [slug]);
        return result.rows[0] as Recipe[]
    }

    static async createRecipe(recipeData: Partial<Recipe>): Promise<Recipe> {
        const result = await db.query(`
            INSERT INTO recipes (title, slug, description, cooking_time, servings, difficulty)
            VALUES ($1, $2, $3, $4, $5, 6)
            RETURNING *
            `, [recipeData.title, recipeData.slug, recipeData.description, recipeData.cooking_time, recipeData.servings, recipeData.difficulty]
        );
        return result.rows[0] as Recipe;
    }
}
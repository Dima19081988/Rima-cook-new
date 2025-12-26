import { db } from "../config/db.js";
import type { Category } from "../models/types/category.js";

export class CategoryService {
    static async getAllCategories(): Promise<Category[]> {
        const result = await db.query('SELECT FROM categories ORDER BY name');
        return result.rows as Category[];
    }
}
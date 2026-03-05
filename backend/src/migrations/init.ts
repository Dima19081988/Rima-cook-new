import { db } from "../config/db.js";

export async function initDB() {
    console.log('🛠️ Creating tables...');

    await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE,
        color VARCHAR(7) DEFAULT '#ff6b6b',
        created_at TIMESTAMP DEFAULT NOW()
    )
    `);

    await db.query(`
    CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        image_url VARCHAR(500),
        cooking_time VARCHAR(50),
        servings INTEGER DEFAULT 4,
        difficulty VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )
    `);

    await db.query(`
    CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        unit VARCHAR(20) DEFAULT 'г'
    )
    `);

    await db.query(`
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
        quantity DECIMAL(6,2),
        PRIMARY KEY (recipe_id, ingredient_id)
    )
    `);

        await db.query(`
        CREATE TABLE IF NOT EXISTS recipe_categories (
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
            PRIMARY KEY (recipe_id, category_id)
        )
        `);

    console.log('✅ Tables created!');
};

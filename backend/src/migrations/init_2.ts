import { db } from "../config/db.js";

export async function initViews() {
    console.log('🛠️ Creating views table...');

    await db.query(`
        CREATE TABLE IF NOT EXISTS recipe_views (
            id SERIAL PRIMARY KEY,
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
            viewed_at TIMESTAMP DEFAULT NOW()
            )
        `);
    console.log('✅ Views table created!');
}
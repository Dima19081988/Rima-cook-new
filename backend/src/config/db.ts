import { config } from 'dotenv';
config();
import { Pool } from 'pg';

const password = process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : undefined;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),

  connect: () => pool.connect(),
};

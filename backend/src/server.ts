import { db } from './config/db.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import recipesRouter from './routes/recipes.js';
import categoriesRouter from './routes/categories.js';
import homeRouter from './routes/home.js';
import adminRouter from './routes/admin.js';


const app = express()
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/home', homeRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running!' });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'OK',
      db: 'Connected',
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('Test DB error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  try {
    await db.connect();
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ DB Error:', err);
  }
});

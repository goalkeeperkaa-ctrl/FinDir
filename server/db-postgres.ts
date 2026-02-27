import pg from 'pg';

const { Client } = pg;

let client: pg.Client | null = null;

export async function initPostgres() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
  }

  client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // For Railway, Supabase, etc
  });

  await client.connect();

  // Create tables if they don't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category_id TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // Seed initial data if empty
  const result = await client.query('SELECT count(*) as count FROM categories');
  if (parseInt(result.rows[0].count) === 0) {
    const categories = [
      { id: 'cat_1', name: 'Выручка', type: 'income' },
      { id: 'cat_2', name: 'Фонд оплаты труда', type: 'expense' },
      { id: 'cat_3', name: 'Сервисы и ПО', type: 'expense' },
      { id: 'cat_4', name: 'Маркетинг', type: 'expense' },
      { id: 'cat_5', name: 'Аренда офиса', type: 'expense' },
      { id: 'cat_6', name: 'Налоги', type: 'expense' },
    ];

    for (const cat of categories) {
      await client.query(
        'INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)',
        [cat.id, cat.name, cat.type]
      );
    }
  }

  console.log('✅ PostgreSQL connected and initialized');
  return client;
}

export function getClient() {
  if (!client) {
    throw new Error('PostgreSQL client not initialized');
  }
  return client;
}

export async function closeConnection() {
  if (client) {
    await client.end();
  }
}

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'finance.db'));

// Initialize tables
db.exec(`
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
    status TEXT DEFAULT 'pending', -- pending, cleared, flagged
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

// Seed some initial data if empty or if English data exists
const count = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
const checkEnglish = db.prepare("SELECT count(*) as count FROM categories WHERE name = 'Revenue'").get() as { count: number };

if (count.count === 0 || checkEnglish.count > 0) {
  // Clear old data
  db.exec('DELETE FROM transactions; DELETE FROM categories;');

  const insertCategory = db.prepare('INSERT INTO categories (id, name, type) VALUES (?, ?, ?)');
  const categories = [
    { id: 'cat_1', name: 'Выручка', type: 'income' },
    { id: 'cat_2', name: 'Фонд оплаты труда', type: 'expense' },
    { id: 'cat_3', name: 'Сервисы и ПО', type: 'expense' },
    { id: 'cat_4', name: 'Маркетинг', type: 'expense' },
    { id: 'cat_5', name: 'Аренда офиса', type: 'expense' },
    { id: 'cat_6', name: 'Налоги', type: 'expense' },
  ];
  
  categories.forEach(c => insertCategory.run(c.id, c.name, c.type));

  const insertTx = db.prepare('INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES (?, ?, ?, ?, ?, ?)');
  
  // Generate some sample transactions for the last 3 months
  const now = new Date();
  for (let i = 0; i < 50; i++) {
    const isIncome = Math.random() > 0.7;
    // Amounts in Rubles (approx 100x USD)
    const amount = isIncome ? Math.floor(Math.random() * 1000000) + 500000 : Math.floor(Math.random() * 200000) + 10000;
    const date = new Date(now.getTime() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const cat = isIncome ? 'cat_1' : ['cat_2', 'cat_3', 'cat_4', 'cat_5', 'cat_6'][Math.floor(Math.random() * 5)];
    const desc = isIncome ? `Оплата от клиента #${i}` : `Оплата поставщику #${i}`;
    
    insertTx.run(`tx_${i}`, date, amount, desc, cat, 'cleared');
  }
}

export default db;

import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const { Client } = pg;

let dbType: 'sqlite' | 'postgresql' = 'sqlite';
let sqliteDb: Database.Database | null = null;
let postgresClient: pg.Client | null = null;

export async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    // PostgreSQL mode
    dbType = 'postgresql';
    postgresClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await postgresClient.connect();

    // Create tables if they don't exist (separate queries)
    await postgresClient.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
      );
    `);

    await postgresClient.query(`
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
    const result = await postgresClient.query('SELECT count(*) as count FROM categories');
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
        await postgresClient.query(
          'INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)',
          [cat.id, cat.name, cat.type]
        );
      }
    }

    console.log('✅ PostgreSQL connected and initialized');
  } else {
    // SQLite mode (default)
    dbType = 'sqlite';

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    sqliteDb = new Database(path.join(dataDir, 'finance.db'));

    sqliteDb.exec(`
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

    const count = sqliteDb.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
    const checkEnglish = sqliteDb.prepare("SELECT count(*) as count FROM categories WHERE name = 'Revenue'").get() as { count: number };

    if (count.count === 0 || checkEnglish.count > 0) {
      sqliteDb.exec('DELETE FROM transactions; DELETE FROM categories;');

      const insertCategory = sqliteDb.prepare('INSERT INTO categories (id, name, type) VALUES (?, ?, ?)');
      const categories = [
        { id: 'cat_1', name: 'Выручка', type: 'income' },
        { id: 'cat_2', name: 'Фонд оплаты труда', type: 'expense' },
        { id: 'cat_3', name: 'Сервисы и ПО', type: 'expense' },
        { id: 'cat_4', name: 'Маркетинг', type: 'expense' },
        { id: 'cat_5', name: 'Аренда офиса', type: 'expense' },
        { id: 'cat_6', name: 'Налоги', type: 'expense' },
      ];

      categories.forEach(c => insertCategory.run(c.id, c.name, c.type));

      const insertTx = sqliteDb.prepare('INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES (?, ?, ?, ?, ?, ?)');

      const now = new Date();
      for (let i = 0; i < 50; i++) {
        const isIncome = Math.random() > 0.7;
        const amount = isIncome ? Math.floor(Math.random() * 1000000) + 500000 : Math.floor(Math.random() * 200000) + 10000;
        const date = new Date(now.getTime() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        const cat = isIncome ? 'cat_1' : ['cat_2', 'cat_3', 'cat_4', 'cat_5', 'cat_6'][Math.floor(Math.random() * 5)];
        const desc = isIncome ? `Оплата от клиента #${i}` : `Оплата поставщику #${i}`;

        insertTx.run(`tx_${i}`, date, amount, desc, cat, 'cleared');
      }
    }

    console.log('✅ SQLite initialized');
  }
}

// Unified query interface
export async function query(sql: string, params?: any[]): Promise<{ rows: any[] }> {
  try {
    if (dbType === 'postgresql') {
      if (!postgresClient) throw new Error('PostgreSQL client not initialized');
      const result = await postgresClient.query(sql, params);
      return { rows: result.rows };
    } else {
      if (!sqliteDb) throw new Error('SQLite database not initialized');
      // Convert PostgreSQL-style $1, $2 params to SQLite-style ?
      let sqliteSql = sql;
      if (params && params.length > 0) {
        params.forEach((_, i) => {
          sqliteSql = sqliteSql.replace(`$${i + 1}`, '?');
        });
      }
      const stmt = sqliteDb.prepare(sqliteSql);
      const rows = params ? stmt.all(...params) : stmt.all();
      return { rows: rows as any[] };
    }
  } catch (error) {
    console.error(`Query failed. DB Type: ${dbType}, SQL: ${sql.substring(0, 100)}`, error);
    throw error;
  }
}

// Get single row
export async function queryOne(sql: string, params?: any[]): Promise<any | undefined> {
  if (dbType === 'postgresql') {
    if (!postgresClient) throw new Error('PostgreSQL client not initialized');
    const result = await postgresClient.query(sql, params);
    return result.rows[0];
  } else {
    if (!sqliteDb) throw new Error('SQLite database not initialized');
    let sqliteSql = sql;
    if (params && params.length > 0) {
      params.forEach((_, i) => {
        sqliteSql = sqliteSql.replace(`$${i + 1}`, '?');
      });
    }
    const stmt = sqliteDb.prepare(sqliteSql);
    return params ? stmt.get(...params) : stmt.get();
  }
}

// Execute INSERT/UPDATE/DELETE
export async function execute(sql: string, params?: any[]): Promise<{ changes: number }> {
  if (dbType === 'postgresql') {
    if (!postgresClient) throw new Error('PostgreSQL client not initialized');
    const result = await postgresClient.query(sql, params);
    return { changes: result.rowCount || 0 };
  } else {
    if (!sqliteDb) throw new Error('SQLite database not initialized');
    let sqliteSql = sql;
    if (params && params.length > 0) {
      params.forEach((_, i) => {
        sqliteSql = sqliteSql.replace(`$${i + 1}`, '?');
      });
    }
    const stmt = sqliteDb.prepare(sqliteSql);
    const info = params ? stmt.run(...params) : stmt.run();
    return { changes: info.changes };
  }
}

export async function closeConnection() {
  if (postgresClient) {
    await postgresClient.end();
  }
  if (sqliteDb) {
    sqliteDb.close();
  }
}

export function getDbType() {
  return dbType;
}

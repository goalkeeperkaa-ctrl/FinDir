import { v4 as uuidv4 } from 'uuid';

// Try to import database manager with detailed logging
let dbManager: any = null;
let useDatabase = false;

async function loadDbManager() {
  console.log('🔍 Attempting to load database manager...');

  try {
    // Попытка 1: динамический импорт TS
    try {
      console.log('Попытка 1: import db-manager.ts');
      dbManager = await import("../server/db-manager");
      useDatabase = true;
      console.log('✅ Загружен db-manager.ts');
      return;
    } catch (e: any) {
      console.log('❌ Не удалось загрузить .ts:', e.message);
    }

    // Попытка 2: require TS
    try {
      console.log('Попытка 2: require db-manager');
      dbManager = require("../server/db-manager");
      useDatabase = true;
      console.log('✅ Загружен db-manager через require');
      return;
    } catch (e: any) {
      console.log('❌ Не удалось загрузить require:', e.message);
    }

    // Попытка 3: динамический импорт JS
    try {
      console.log('Попытка 3: import db-manager.js');
      dbManager = await import("../server/db-manager.js");
      useDatabase = true;
      console.log('✅ Загружен db-manager.js');
      return;
    } catch (e: any) {
      console.log('❌ Не удалось загрузить .js:', e.message);
    }

    console.warn('⚠️ Database manager не доступен, используем fallback');
    useDatabase = false;
  } catch (e: any) {
    console.error('❌ Ошибка при загрузке db-manager:', e);
    useDatabase = false;
  }
}

// Инициализируем при импорте модуля
loadDbManager();

// Fallback categories
const fallbackCategories = [
  { id: "cat_1", name: "Выручка", type: "income" },
  { id: "cat_2", name: "Фонд оплаты труда", type: "expense" },
  { id: "cat_3", name: "Сервисы и ПО", type: "expense" },
  { id: "cat_4", name: "Маркетинг", type: "expense" },
  { id: "cat_5", name: "Аренда офиса", type: "expense" },
  { id: "cat_6", name: "Налоги", type: "expense" },
];

// Initialize fallback transactions with sample data
let fallbackTransactions: any[] = [];

function initializeFallbackData() {
  if (fallbackTransactions.length === 0) {
    const now = new Date();
    const sampleTransactions = [];

    for (let i = 0; i < 50; i++) {
      const isIncome = Math.random() > 0.7;
      const amount = isIncome
        ? Math.floor(Math.random() * 1000000) + 500000
        : Math.floor(Math.random() * 200000) + 10000;
      const date = new Date(now.getTime() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
        .toISOString()
        .split('T')[0];
      const categoryId = isIncome ? 'cat_1' : ['cat_2', 'cat_3', 'cat_4', 'cat_5', 'cat_6'][Math.floor(Math.random() * 5)];
      const category = fallbackCategories.find(c => c.id === categoryId)!;

      sampleTransactions.push({
        id: `tx_${i}`,
        date,
        amount,
        description: isIncome ? `Оплата от клиента #${i}` : `Оплата поставщику #${i}`,
        category_id: categoryId,
        category_name: category.name,
        category_type: category.type,
        status: 'completed'
      });
    }

    fallbackTransactions = sampleTransactions;
  }
}

let dbInitialized = false;

async function ensureDbInitialized() {
  initializeFallbackData();

  if (!dbInitialized && useDatabase && dbManager) {
    try {
      await dbManager.initializeDatabase();
      dbInitialized = true;
    } catch (e: any) {
      useDatabase = false;
    }
  }
}

async function getTransactions() {
  try {
    await ensureDbInitialized();

    if (useDatabase && dbManager) {
      const result = await dbManager.query('SELECT * FROM transactions ORDER BY date DESC');
      const categoriesResult = await dbManager.query('SELECT * FROM categories');
      const categoryMap = Object.fromEntries(categoriesResult.rows.map((c: any) => [c.id, c]));

      const transactions = result.rows.map((t: any) => ({
        ...t,
        category_name: categoryMap[t.category_id]?.name || 'Unknown',
        category_type: categoryMap[t.category_id]?.type || 'expense'
      }));
      return transactions;
    }
  } catch (e) {
    console.error('Database query failed:', e);
  }

  return fallbackTransactions;
}

export default async function handler(req: any, res: any) {
  try {
    const transactions = await getTransactions();

    res.status(200).json({
      status: "healthy",
      database: useDatabase && dbManager ? "PostgreSQL" : "Fallback (Memory)",
      transactionCount: transactions.length,
      hasData: transactions.length > 0,
      sampleData: transactions.slice(0, 2)
    });
  } catch (e: any) {
    res.status(200).json({
      status: "error",
      error: e.message,
      database: useDatabase && dbManager ? "PostgreSQL" : "Fallback (Memory)"
    });
  }
}

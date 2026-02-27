import express from "express";
import { createServer as createViteServer } from "vite";
import { initializeDatabase, query, queryOne, execute } from "./server/db-manager";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dbInitialized: dbInitialized,
    dbError: dbError ? String(dbError) : null,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? "yes" : "no",
      DATABASE_URL_SET: process.env.DATABASE_URL ? "yes" : "no"
    }
  });
});

// --- API Routes ---

// Get all transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, c.name as category_name, c.type as category_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Add a transaction
app.post("/api/transactions", async (req, res) => {
  const { date, amount, description, category_id } = req.body;
  const id = uuidv4();
  try {
    await execute('INSERT INTO transactions (id, date, amount, description, category_id) VALUES ($1, $2, $3, $4, $5)',
      [id, date, amount, description, category_id || null]);
    res.json({ id, date, amount, description, category_id });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: "Failed to add transaction" });
  }
});

// Get stats for dashboard
app.get("/api/stats", async (req, res) => {
  try {
    const incomeResult = await queryOne("SELECT SUM(amount) as total FROM transactions WHERE category_id IN (SELECT id FROM categories WHERE type = 'income')");
    const expenseResult = await queryOne("SELECT SUM(amount) as total FROM transactions WHERE category_id IN (SELECT id FROM categories WHERE type = 'expense')");

    const income = (incomeResult?.total as any) || 0;
    const expenses = (expenseResult?.total as any) || 0;

    // Monthly data for chart
    const monthlyResult = await query(`
      SELECT SUBSTRING(t.date, 1, 7) as month,
             SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as income,
             SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as expense
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      GROUP BY SUBSTRING(t.date, 1, 7)
      ORDER BY month ASC
      LIMIT 12
    `);
    const monthlyData = monthlyResult.rows;

    // Expense distribution for current month
    const currentMonth = new Date().toISOString().split('T')[0].slice(0, 7);
    const expenseDistResult = await query(`
      SELECT c.name, SUM(t.amount) as value
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE c.type = 'expense' AND SUBSTRING(t.date, 1, 7) = $1
      GROUP BY c.name
      ORDER BY value DESC
    `, [currentMonth]);
    const expenseDistribution = expenseDistResult.rows as { name: string, value: number }[];

    // Budget Progress (Mock budgets for demonstration)
    const BUDGET_LIMITS: Record<string, number> = {
      'Фонд оплаты труда': 600000,
      'Сервисы и ПО': 80000,
      'Маркетинг': 200000,
      'Аренда офиса': 150000,
      'Налоги': 100000
    };

    const budgetProgress = expenseDistribution.map(item => ({
      category: item.name,
      spent: item.value,
      limit: BUDGET_LIMITS[item.name] || 100000,
      percentage: Math.min(100, (item.value / (BUDGET_LIMITS[item.name] || 100000)) * 100)
    })).sort((a, b) => b.percentage - a.percentage);

    res.json({
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      chartData: monthlyData,
      expenseDistribution,
      budgetProgress
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// AI Categorization Endpoint
app.post("/api/categorize", async (req, res) => {
  const { description, amount } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API Key not configured" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Fetch available categories
    const categoriesResult = await query('SELECT id, name, type FROM categories');
    const categories = categoriesResult.rows as { id: string, name: string, type: string }[];
    const categoriesJson = JSON.stringify(categories);

    const prompt = `
      Analyze the following transaction description and amount:
      Description: "${description}"
      Amount: ${amount}

      Available Categories:
      ${categoriesJson}

      Task: Select the most appropriate category ID for this transaction.
      Return ONLY the category ID as a plain string. Do not include any other text or JSON formatting.
      If no category fits well, return the ID for "Сервисы и ПО" (or similar general expense) if it's an expense, or "Выручка" if it's income.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const categoryId = result.text?.trim();

    // Verify the category exists
    const category = categories.find(c => c.id === categoryId);

    if (category) {
      res.json({ category_id: category.id, category_name: category.name });
    } else {
      // Fallback if AI hallucinates an ID
      const defaultCat = amount > 0 ? categories.find(c => c.type === 'income') : categories.find(c => c.type === 'expense');
      res.json({ category_id: defaultCat?.id, category_name: defaultCat?.name });
    }

  } catch (error) {
    console.error("AI Categorization Error:", error);
    res.status(500).json({ error: "Failed to categorize transaction" });
  }
});

// P&L Report Endpoint
app.get("/api/reports/p-l", async (req, res) => {
  try {
    const result = await query(`
      SELECT
        c.name as category,
        c.type,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      GROUP BY c.id, c.name, c.type
      ORDER BY c.type DESC, total_amount DESC
    `);
    const data = result.rows as any[];

    const income = data.filter(row => row.type === 'income');
    const expenses = data.filter(row => row.type === 'expense');

    const totalIncome = income.reduce((sum, row) => sum + (row.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, row) => sum + (row.total_amount || 0), 0);

    res.json({
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error("P&L Report Error:", error);
    res.status(500).json({ error: "Failed to generate P&L report" });
  }
});

// Bulk Import Transactions Endpoint
app.post("/api/import", async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "Invalid or empty transactions array" });
    }

    let imported = 0;
    let errors: string[] = [];

    for (const [index, tx] of transactions.entries()) {
      try {
        const date = tx.date || new Date().toISOString().split('T')[0];
        const amount = parseFloat(tx.amount);
        const description = tx.description || 'Импортированная транзакция';
        let category_id = tx.category_id;

        if (!date || isNaN(amount)) {
          errors.push(`Строка ${index + 1}: Недостаточные данные (дата/сумма)`);
          continue;
        }

        // If category not provided, try to find by name
        if (!category_id && tx.category_name) {
          const catResult = await query('SELECT id FROM categories WHERE LOWER(name) LIKE LOWER($1)', [`%${tx.category_name}%`]);
          if (catResult.rows.length > 0) {
            category_id = catResult.rows[0].id;
          }
        }

        const id = uuidv4();
        await execute('INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, date, amount, description, category_id || null, 'cleared']);
        imported++;
      } catch (e) {
        errors.push(`Строка ${index + 1}: ${String(e)}`);
      }
    }

    res.json({
      imported,
      errors: errors.length > 0 ? errors : undefined,
      total: transactions.length
    });
  } catch (error) {
    console.error("Import Error:", error);
    res.status(500).json({ error: "Failed to import transactions" });
  }
});

// Cash Flow Report Endpoint
app.get("/api/reports/cash-flow", async (req, res) => {
  try {
    const result = await query(`
      SELECT
        SUBSTRING(t.date, 1, 7) as month,
        SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as inflows,
        SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as outflows,
        COUNT(CASE WHEN c.type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN c.type = 'expense' THEN 1 END) as expense_count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      GROUP BY SUBSTRING(t.date, 1, 7)
      ORDER BY month ASC
    `);
    const data = result.rows as any[];

    const cashFlow = data.map(row => ({
      month: row.month,
      inflows: row.inflows || 0,
      outflows: row.outflows || 0,
      netFlow: (row.inflows || 0) - (row.outflows || 0),
      income_count: row.income_count,
      expense_count: row.expense_count
    }));

    res.json(cashFlow);
  } catch (error) {
    console.error("Cash Flow Report Error:", error);
    res.status(500).json({ error: "Failed to generate cash flow report" });
  }
});

// AI Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API Key not configured" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Fetch context data (last 50 transactions summary)
    const txResult = await query(`
      SELECT t.date, t.amount, t.description, c.name as category, c.type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC LIMIT 50
    `);
    const transactions = txResult.rows;

    const context = JSON.stringify(transactions);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: `Ты — 'AFM', ИИ-ассистент финансовой платформы.
        У тебя есть доступ к последним финансовым транзакциям пользователя в формате JSON.
        Отвечай на вопросы о финансах, тратах и прибыльности.
        Твой тон: профессиональный, лаконичный, футуристичный.
        Язык ответов: Русский.
        Валюта: Рубли (₽).

        Контекст данных: ${context}`
      }
    });

    const response = result.text;
    res.json({ response });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});


// Initialize database at startup
let dbInitialized = false;
let dbError: any = null;

async function initDb() {
  try {
    await initializeDatabase();
    dbInitialized = true;
    console.log("✅ Database initialized successfully");
  } catch (error) {
    dbError = error;
    console.error("❌ Database initialization failed:", error);
    // Don't exit - let the function continue and handle errors per-request
  }
}

// Start initialization immediately
initDb();

// Add middleware to check DB status
app.use((req, res, next) => {
  if (!dbInitialized && dbError) {
    console.error("Request made before DB ready, error was:", dbError);
  }
  next();
});

// Initialize database and start server
async function start() {
  try {
    // Vite Middleware (only in non-production)
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }

    if (!process.env.VERCEL) {
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });

      // Graceful shutdown
      process.on("SIGTERM", () => {
        console.log("SIGTERM received, shutting down gracefully");
        server.close(() => {
          process.exit(0);
        });
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    // Don't exit on Vercel - just log the error
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

start();

export default app;

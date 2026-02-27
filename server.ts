import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./server/db";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(express.json());

// --- API Routes ---

// Get all transactions
app.get("/api/transactions", (req, res) => {
  const stmt = db.prepare(`
    SELECT t.*, c.name as category_name, c.type as category_type 
    FROM transactions t 
    LEFT JOIN categories c ON t.category_id = c.id 
    ORDER BY t.date DESC
  `);
  const transactions = stmt.all();
  res.json(transactions);
});

// Get all categories
app.get("/api/categories", (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
});

// Add a transaction
app.post("/api/transactions", (req, res) => {
  const { date, amount, description, category_id } = req.body;
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO transactions (id, date, amount, description, category_id) VALUES (?, ?, ?, ?, ?)');
  try {
    stmt.run(id, date, amount, description, category_id || null);
    res.json({ id, date, amount, description, category_id });
  } catch (error) {
    res.status(500).json({ error: "Failed to add transaction" });
  }
});

// Get stats for dashboard
app.get("/api/stats", (req, res) => {
  const incomeStmt = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE category_id IN (SELECT id FROM categories WHERE type = 'income')");
  const expenseStmt = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE category_id IN (SELECT id FROM categories WHERE type = 'expense')");
  
  const income = (incomeStmt.get() as any).total || 0;
  const expenses = (expenseStmt.get() as any).total || 0;
  
  // Monthly data for chart
  const monthlyStmt = db.prepare(`
    SELECT strftime('%Y-%m', date) as month, 
           SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as income,
           SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as expense
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    GROUP BY month
    ORDER BY month ASC
    LIMIT 12
  `);
  const monthlyData = monthlyStmt.all();

  // Expense distribution for current month
  const expenseDistStmt = db.prepare(`
    SELECT c.name, SUM(t.amount) as value
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE c.type = 'expense' AND strftime('%Y-%m', t.date) = strftime('%Y-%m', 'now')
    GROUP BY c.name
    ORDER BY value DESC
  `);
  const expenseDistribution = expenseDistStmt.all() as { name: string, value: number }[];

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
    limit: BUDGET_LIMITS[item.name] || 100000, // Default limit if not specified
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
    const categories = db.prepare('SELECT id, name, type FROM categories').all() as { id: string, name: string, type: string }[];
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
app.get("/api/reports/p-l", (req, res) => {
  try {
    const stmt = db.prepare(`
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
    const data = stmt.all() as any[];

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
app.post("/api/import", (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "Invalid or empty transactions array" });
    }

    const insertTx = db.prepare('INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES (?, ?, ?, ?, ?, ?)');
    const getCategory = db.prepare('SELECT id FROM categories WHERE LOWER(name) LIKE LOWER(?)');

    let imported = 0;
    let errors: string[] = [];

    transactions.forEach((tx: any, index: number) => {
      try {
        const date = tx.date || new Date().toISOString().split('T')[0];
        const amount = parseFloat(tx.amount);
        const description = tx.description || 'Импортированная транзакция';
        let category_id = tx.category_id;

        if (!date || isNaN(amount)) {
          errors.push(`Строка ${index + 1}: Недостаточные данные (дата/сумма)`);
          return;
        }

        // If category not provided, try to find by name
        if (!category_id && tx.category_name) {
          const cat = getCategory.get(`%${tx.category_name}%`) as { id: string } | undefined;
          category_id = cat?.id;
        }

        const id = uuidv4();
        insertTx.run(id, date, amount, description, category_id || null, 'cleared');
        imported++;
      } catch (e) {
        errors.push(`Строка ${index + 1}: ${String(e)}`);
      }
    });

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
app.get("/api/reports/cash-flow", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT
        strftime('%Y-%m', t.date) as month,
        SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as inflows,
        SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as outflows,
        COUNT(CASE WHEN c.type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN c.type = 'expense' THEN 1 END) as expense_count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      GROUP BY month
      ORDER BY month ASC
    `);
    const data = stmt.all() as any[];

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
    const txStmt = db.prepare(`
      SELECT t.date, t.amount, t.description, c.name as category, c.type 
      FROM transactions t 
      LEFT JOIN categories c ON t.category_id = c.id 
      ORDER BY t.date DESC LIMIT 50
    `);
    const transactions = txStmt.all();
    
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


// ... Vite Middleware ...
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

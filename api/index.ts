import express, { Request, Response, NextFunction } from "express";
import { initializeDatabase, query, execute } from "../server/db-manager";
import OpenAI from "openai";
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

let dbInitialized = false;

// Ensure DB is initialized
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// Database wrapper for routes
const withDatabase = (handler: any) => async (req: Request, res: Response) => {
  try {
    await ensureDbInitialized();
    return handler(req, res);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running" });
});

// Health check
app.get("/api/health", withDatabase(async (req, res) => {
  res.json({ status: "healthy", database: "connected" });
}));

// Get transactions
app.get("/api/transactions", withDatabase(async (req, res) => {
  const result = await query(`
    SELECT t.*, c.name as category_name, c.type as category_type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC
  `);
  res.json(result.rows);
}));

// Add transaction
app.post("/api/transactions", withDatabase(async (req, res) => {
  const { date, amount, description, category_id } = req.body;
  const id = uuidv4();
  await execute(
    "INSERT INTO transactions (id, date, amount, description, category_id) VALUES ($1, $2, $3, $4, $5)",
    [id, date, amount, description, category_id]
  );
  res.json({ id, date, amount, description, category_id });
}));

// Get categories
app.get("/api/categories", withDatabase(async (req, res) => {
  const result = await query("SELECT * FROM categories ORDER BY name");
  res.json(result.rows);
}));

// Create category
app.post("/api/categories", withDatabase(async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: "Name and type required" });
  }
  const id = uuidv4();
  await execute("INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)", [id, name, type]);
  res.json({ id, name, type });
}));

// Dashboard stats
app.get("/api/stats", withDatabase(async (req, res) => {
  const result = await query(`
    SELECT 
      SUM(CASE WHEN date >= date_trunc('month', NOW()) THEN amount ELSE 0 END) as monthlyRevenue,
      SUM(CASE WHEN c.type = 'expense' AND date >= date_trunc('month', NOW()) THEN amount ELSE 0 END) as monthlyExpenses,
      SUM(CASE WHEN c.type = 'income' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN c.type = 'expense' THEN amount ELSE 0 END) as totalExpenses
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
  `);
  const row = result.rows[0] || {};
  res.json({
    monthlyRevenue: row.monthlyrevenue || 0,
    monthlyExpenses: row.monthlyexpenses || 0,
    totalIncome: row.totalincome || 0,
    totalExpenses: row.totalexpenses || 0,
    profit: (row.totalincome || 0) - (row.totalexpenses || 0)
  });
}));

// P&L Report
app.get("/api/reports/p-l", withDatabase(async (req, res) => {
  const result = await query(`
    SELECT c.name, SUM(t.amount) as amount, c.type
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    GROUP BY c.id, c.name, c.type
  `);
  res.json(result.rows);
}));

// Cash Flow Report
app.get("/api/reports/cash-flow", withDatabase(async (req, res) => {
  const result = await query(`
    SELECT DATE_TRUNC('month', date) as month, c.type, SUM(amount) as amount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    GROUP BY DATE_TRUNC('month', date), c.type
    ORDER BY month DESC
  `);
  res.json(result.rows);
}));

// Anomalies
app.get("/api/anomalies", withDatabase(async (req, res) => {
  res.json({ anomalies: [], summary: { total: 0, high: 0, medium: 0 } });
}));

// Unit Economics  
app.get("/api/unit-economics", withDatabase(async (req, res) => {
  const result = await query(`
    SELECT 
      SUM(CASE WHEN c.type = 'income' THEN amount ELSE 0 END) as revenue,
      SUM(CASE WHEN c.type = 'expense' THEN amount ELSE 0 END) as expenses
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
  `);
  const row = result.rows[0] || {};
  res.json({
    revenue: row.revenue || 0,
    expenses: row.expenses || 0,
    profit: (row.revenue || 0) - (row.expenses || 0)
  });
}));

// CSV Import
app.post("/api/import", withDatabase(async (req, res) => {
  const { transactions } = req.body;
  const imported = [];
  
  for (const tx of transactions) {
    const id = uuidv4();
    await execute(
      "INSERT INTO transactions (id, date, amount, description, category_id) VALUES ($1, $2, $3, $4, $5)",
      [id, tx.date, tx.amount, tx.description, tx.category_id || '3']
    );
    imported.push({ id, ...tx });
  }
  
  res.json({ imported, count: imported.length });
}));

// AI Categorize
app.post("/api/categorize", withDatabase(async (req, res) => {
  const { description, amount } = req.body;
  if (!process.env.OPENAI_API_KEY) {
    const cats = await query("SELECT * FROM categories");
    const defaultCat = cats.rows.find((c: any) => c.type === (amount > 0 ? 'income' : 'expense'));
    return res.json({ category_id: defaultCat?.id, category_name: defaultCat?.name });
  }
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const cats = await query("SELECT id, name, type FROM categories");
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: 'user',
        content: `Categorize: "${description}" (${amount}). Categories: ${JSON.stringify(cats.rows)}. Return ONLY category ID.`
      }],
    });
    const catId = result.choices[0].message.content?.trim();
    const cat = cats.rows.find((c: any) => c.id === catId);
    res.json({ category_id: cat?.id || cats.rows[0].id, category_name: cat?.name || cats.rows[0].name });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}));

// AI Chat
app.post("/api/chat", withDatabase(async (req, res) => {
  const { message } = req.body;
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ response: "AI features not configured" });
  }
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: message }],
    });
    res.json({ response: result.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}));

export default app;

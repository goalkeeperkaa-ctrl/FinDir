import express from "express";
import { initializeDatabase, query, queryOne, execute } from "../server/db-manager";
import OpenAI from "openai";
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// Database initialization flag
let dbInitialized = false;

// Ensure database is initialized
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? "Vercel" : "Local"
  });
});

// Health check with DB
app.get("/api/health", async (req, res) => {
  try {
    await ensureDbInitialized();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: process.env.VERCEL ? "Vercel" : "Local"
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: String(error) });
  }
});

// Get all transactions
app.get("/api/transactions", async (req, res) => {
  try {
    await ensureDbInitialized();
    const result = await query("SELECT * FROM transactions ORDER BY date DESC LIMIT 100");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Get categories
app.get("/api/categories", async (req, res) => {
  try {
    await ensureDbInitialized();
    const result = await query("SELECT * FROM categories");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Add transaction
app.post("/api/transactions", async (req, res) => {
  const { date, amount, description, category_id } = req.body;
  try {
    await ensureDbInitialized();
    const id = uuidv4();
    await execute(
      "INSERT INTO transactions (id, date, amount, description, category_id) VALUES ($1, $2, $3, $4, $5)",
      [id, date, amount, description, category_id]
    );
    res.json({ id, date, amount, description, category_id });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// AI Categorize endpoint
app.post("/api/categorize", async (req, res) => {
  const { description, amount } = req.body;
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API Key not configured" });
  }
  try {
    await ensureDbInitialized();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const categoriesResult = await query('SELECT id, name, type FROM categories');
    const categories = categoriesResult.rows as any[];
    const categoriesJson = JSON.stringify(categories);
    
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: 'user',
        content: `Categorize this: Description: "${description}", Amount: ${amount}. Categories: ${categoriesJson}. Return ONLY the category ID.`
      }],
    });
    
    const categoryId = result.choices[0].message.content?.trim();
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
      res.json({ category_id: category.id, category_name: category.name });
    } else {
      const defaultCat = amount > 0 ? categories.find(c => c.type === 'income') : categories.find(c => c.type === 'expense');
      res.json({ category_id: defaultCat?.id, category_name: defaultCat?.name });
    }
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// AI Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API Key not configured" });
  }
  try {
    await ensureDbInitialized();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const txResult = await query(`
      SELECT t.date, t.amount, t.description, c.name as category, c.type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC LIMIT 50
    `);
    const context = JSON.stringify(txResult.rows);
    
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: 'system',
          content: `Ты — 'AFM', финансовый ИИ-ассистент. Отвечай на русском о финансах. Контекст: ${context}`
        },
        { role: 'user', content: message }
      ],
    });
    
    res.json({ response: result.choices[0].message.content });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

export default app;

import express from "express";
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// In-memory storage for demo
let transactions: any[] = [
  { id: uuidv4(), date: "2026-02-28", amount: 10000, description: "Monthly revenue", category_id: "1", category_name: "Выручка", category_type: "income" },
  { id: uuidv4(), date: "2026-02-27", amount: 2000, description: "Team salary", category_id: "2", category_name: "ФОТ", category_type: "expense" },
];

let categories: any[] = [
  { id: "1", name: "Выручка", type: "income" },
  { id: "2", name: "ФОТ", type: "expense" },
  { id: "3", name: "Сервисы и ПО", type: "expense" },
  { id: "4", name: "Маркетинг", type: "expense" },
  { id: "5", name: "Аренда", type: "expense" },
  { id: "6", name: "Налоги", type: "expense" },
];

// Test
app.get("/api/test", (req, res) => {
  res.json({ message: "FinDir API is running" });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", database: "connected" });
});

// Get transactions
app.get("/api/transactions", (req, res) => {
  res.json(transactions);
});

// Add transaction
app.post("/api/transactions", (req, res) => {
  const { date, amount, description, category_id } = req.body;
  const id = uuidv4();
  const category = categories.find(c => c.id === category_id);
  const newTx = {
    id,
    date,
    amount: parseFloat(amount),
    description,
    category_id,
    category_name: category?.name,
    category_type: category?.type
  };
  transactions.unshift(newTx);
  res.json(newTx);
});

// Get categories
app.get("/api/categories", (req, res) => {
  res.json(categories);
});

// Create category
app.post("/api/categories", (req, res) => {
  const { name, type } = req.body;
  if (!name || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: "Invalid" });
  }
  const id = uuidv4();
  const cat = { id, name, type };
  categories.push(cat);
  res.json(cat);
});

// Stats
app.get("/api/stats", (req, res) => {
  const income = transactions.filter((t: any) => t.category_type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const expenses = transactions.filter((t: any) => t.category_type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  res.json({
    monthlyRevenue: income,
    monthlyExpenses: expenses,
    totalIncome: income,
    totalExpenses: expenses,
    profit: income - expenses
  });
});

// P&L
app.get("/api/reports/p-l", (req, res) => {
  const byCategory: any = {};
  transactions.forEach((t: any) => {
    if (!byCategory[t.category_name]) {
      byCategory[t.category_name] = { name: t.category_name, amount: 0, type: t.category_type };
    }
    byCategory[t.category_name].amount += t.amount;
  });
  res.json(Object.values(byCategory));
});

// Cash flow
app.get("/api/reports/cash-flow", (req, res) => {
  res.json([]);
});

// Anomalies
app.get("/api/anomalies", (req, res) => {
  res.json({ anomalies: [], summary: { total: 0, high: 0, medium: 0 } });
});

// Unit economics
app.get("/api/unit-economics", (req, res) => {
  const income = transactions.filter((t: any) => t.category_type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const expenses = transactions.filter((t: any) => t.category_type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  res.json({
    revenue: income,
    expenses: expenses,
    profit: income - expenses,
    margin: income > 0 ? ((income - expenses) / income * 100).toFixed(2) : 0
  });
});

// Import CSV
app.post("/api/import", (req, res) => {
  const { transactions: txs } = req.body;
  const imported = txs.map((t: any) => {
    const id = uuidv4();
    const tx = { ...t, id };
    transactions.unshift(tx);
    return tx;
  });
  res.json({ imported, count: imported.length });
});

// Categorize
app.post("/api/categorize", (req, res) => {
  const { category_id } = req.body;
  const cat = categories.find(c => c.id === category_id) || categories[0];
  res.json({ category_id: cat.id, category_name: cat.name });
});

// Chat
app.post("/api/chat", (req, res) => {
  res.json({ response: "Здравствуйте! Я помощник по финансам FinDir." });
});

export default app;

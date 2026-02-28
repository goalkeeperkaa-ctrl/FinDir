import express from "express";
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// In-memory storage for demo
let transactions: any[] = [
  { id: uuidv4(), date: "2026-02-28", amount: 10000, description: "Monthly revenue", category_id: "1", category_name: "Выручка", category_type: "income", status: "completed" },
  { id: uuidv4(), date: "2026-02-27", amount: 2000, description: "Team salary", category_id: "2", category_name: "ФОТ", category_type: "expense", status: "completed" },
  { id: uuidv4(), date: "2026-26", amount: 500, description: "Software services", category_id: "3", category_name: "Сервисы и ПО", category_type: "expense", status: "completed" },
  { id: uuidv4(), date: "2026-25", amount: 3000, description: "Marketing campaign", category_id: "4", category_name: "Маркетинг", category_type: "expense", status: "completed" },
  { id: uuidv4(), date: "2026-24", amount: 8000, description: "Monthly revenue", category_id: "1", category_name: "Выручка", category_type: "income", status: "completed" },
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
    category_type: category?.type,
    status: "completed"
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

  // Group transactions by date for chart data
  const dailyData: any = {};
  transactions.forEach((t: any) => {
    if (!dailyData[t.date]) {
      dailyData[t.date] = { date: t.date, income: 0, expenses: 0 };
    }
    if (t.category_type === 'income') {
      dailyData[t.date].income += t.amount;
    } else {
      dailyData[t.date].expenses += t.amount;
    }
  });
  const chartData = Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date));

  // Expense distribution by category
  const expensesByCategory: any = {};
  transactions.filter((t: any) => t.category_type === 'expense').forEach((t: any) => {
    if (!expensesByCategory[t.category_name]) {
      expensesByCategory[t.category_name] = 0;
    }
    expensesByCategory[t.category_name] += t.amount;
  });
  const expenseDistribution = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

  res.json({
    totalIncome: income,
    totalExpenses: expenses,
    netProfit: income - expenses,
    chartData,
    expenseDistribution,
    budgetProgress: []
  });
});

// P&L
app.get("/api/reports/p-l", (req, res) => {
  const totalIncome = transactions.filter((t: any) => t.category_type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t: any) => t.category_type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0;

  const byCategory: any = {};
  transactions.forEach((t: any) => {
    if (!byCategory[t.category_name]) {
      byCategory[t.category_name] = { category: t.category_name, total_amount: 0, type: t.category_type };
    }
    byCategory[t.category_name].total_amount += t.amount;
  });

  const incomeRows = Object.values(byCategory).filter((c: any) => c.type === 'income');
  const expenseRows = Object.values(byCategory).filter((c: any) => c.type === 'expense');

  res.json({
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin,
    income: incomeRows,
    expenses: expenseRows
  });
});

// Cash flow
app.get("/api/reports/cash-flow", (req, res) => {
  const monthlyData: any = {};

  transactions.forEach((t: any) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, inflow: 0, outflow: 0 };
    }

    if (t.category_type === 'income') {
      monthlyData[monthKey].inflow += t.amount;
    } else {
      monthlyData[monthKey].outflow += t.amount;
    }
  });

  const cashFlow = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .map((m: any) => ({
      ...m,
      net: m.inflow - m.outflow
    }));

  res.json(cashFlow);
});

// Anomalies
app.get("/api/anomalies", (req, res) => {
  res.json({ anomalies: [], summary: { total: 0, high: 0, medium: 0 } });
});

// Unit economics
app.get("/api/unit-economics", (req, res) => {
  const revenue = transactions.filter((t: any) => t.category_type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const expenses = transactions.filter((t: any) => t.category_type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const profit = revenue - expenses;
  const margin_percent = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

  // Get monthly data for trends
  const monthlyData: any = {};
  transactions.forEach((t: any) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, revenue: 0, expenses: 0 };
    }

    if (t.category_type === 'income') {
      monthlyData[monthKey].revenue += t.amount;
    } else {
      monthlyData[monthKey].expenses += t.amount;
    }
  });

  const sortedMonths = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month));

  // Calculate month-over-month growth
  let revenue_mom = 0, expense_mom = 0;
  if (sortedMonths.length >= 2) {
    const last = sortedMonths[sortedMonths.length - 1] as any;
    const prev = sortedMonths[sortedMonths.length - 2] as any;
    revenue_mom = prev.revenue > 0 ? (((last.revenue - prev.revenue) / prev.revenue) * 100).toFixed(2) as any : 0;
    expense_mom = prev.expenses > 0 ? (((last.expenses - prev.expenses) / prev.expenses) * 100).toFixed(2) as any : 0;
  }

  // Burn rate and runway (simplified)
  const monthlyBurnRate = expenses / (sortedMonths.length || 1);
  const cash_reserve = 100000; // Example
  const runway_months = monthlyBurnRate > 0 ? Math.round(cash_reserve / monthlyBurnRate) : 0;

  res.json({
    revenue,
    expenses,
    profit,
    margin_percent,
    burn_rate: Math.round(monthlyBurnRate),
    runway_months,
    growth: {
      revenue_mom,
      expense_mom
    },
    monthly_data: sortedMonths
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

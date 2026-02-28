import express from "express";
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase, query, queryOne, execute } from "../server/db-manager";

const app = express();
app.use(express.json());

// Initialize database on startup
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// Test
app.get("/api/test", (req, res) => {
  res.json({ message: "FinDir API is running" });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", database: "connected" });
});

// Get transactions
app.get("/api/transactions", async (req, res) => {
  try {
    await ensureDbInitialized();
    const result = await query('SELECT * FROM transactions ORDER BY date DESC');

    // Enrich with category info
    const categoriesResult = await query('SELECT * FROM categories');
    const categoryMap = Object.fromEntries(categoriesResult.rows.map((c: any) => [c.id, c]));

    const enriched = result.rows.map((t: any) => ({
      ...t,
      category_name: categoryMap[t.category_id]?.name || 'Unknown',
      category_type: categoryMap[t.category_id]?.type || 'expense'
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add transaction
app.post("/api/transactions", async (req, res) => {
  try {
    await ensureDbInitialized();
    const { date, amount, description, category_id } = req.body;
    const id = uuidv4();

    // Get category info
    const category = await queryOne('SELECT * FROM categories WHERE id = $1', [category_id]);

    // Insert transaction
    await execute(
      'INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, date, parseFloat(amount), description, category_id, 'completed']
    );

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

    res.json(newTx);
  } catch (error: any) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get categories
app.get("/api/categories", async (req, res) => {
  try {
    await ensureDbInitialized();
    const result = await query('SELECT * FROM categories ORDER BY type, name');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create category
app.post("/api/categories", async (req, res) => {
  try {
    await ensureDbInitialized();
    const { name, type } = req.body;
    if (!name || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: "Invalid" });
    }
    const id = uuidv4();
    await execute(
      'INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)',
      [id, name, type]
    );
    res.json({ id, name, type });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stats
app.get("/api/stats", async (req, res) => {
  try {
    await ensureDbInitialized();

    // Get all transactions with category info
    const txResult = await query(`
      SELECT t.*, c.type as category_type, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
    `);

    const transactions = txResult.rows;

    const income = transactions
      .filter((t: any) => t.category_type === 'income')
      .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
    const expenses = transactions
      .filter((t: any) => t.category_type === 'expense')
      .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

    // Group transactions by date for chart data
    const dailyData: any = {};
    transactions.forEach((t: any) => {
      if (!dailyData[t.date]) {
        dailyData[t.date] = { date: t.date, income: 0, expenses: 0 };
      }
      const amount = parseFloat(t.amount) || 0;
      if (t.category_type === 'income') {
        dailyData[t.date].income += amount;
      } else {
        dailyData[t.date].expenses += amount;
      }
    });
    const chartData = Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date));

    // Expense distribution by category
    const expensesByCategory: any = {};
    transactions.filter((t: any) => t.category_type === 'expense').forEach((t: any) => {
      if (!expensesByCategory[t.category_name]) {
        expensesByCategory[t.category_name] = 0;
      }
      expensesByCategory[t.category_name] += parseFloat(t.amount) || 0;
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
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// P&L
app.get("/api/reports/p-l", async (req, res) => {
  try {
    await ensureDbInitialized();

    const txResult = await query(`
      SELECT t.*, c.type as category_type, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
    `);

    const transactions = txResult.rows;

    const totalIncome = transactions
      .filter((t: any) => t.category_type === 'income')
      .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
    const totalExpenses = transactions
      .filter((t: any) => t.category_type === 'expense')
      .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0;

    const byCategory: any = {};
    transactions.forEach((t: any) => {
      if (!byCategory[t.category_name]) {
        byCategory[t.category_name] = { category: t.category_name, total_amount: 0, type: t.category_type };
      }
      byCategory[t.category_name].total_amount += parseFloat(t.amount) || 0;
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
  } catch (error: any) {
    console.error('P&L report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cash flow
app.get("/api/reports/cash-flow", async (req, res) => {
  try {
    await ensureDbInitialized();

    const txResult = await query(`
      SELECT t.*, c.type as category_type, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
    `);

    const transactions = txResult.rows;
    const monthlyData: any = {};

    transactions.forEach((t: any) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, inflow: 0, outflow: 0 };
      }

      const amount = parseFloat(t.amount) || 0;
      if (t.category_type === 'income') {
        monthlyData[monthKey].inflow += amount;
      } else {
        monthlyData[monthKey].outflow += amount;
      }
    });

    const cashFlow = Object.values(monthlyData)
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .map((m: any) => ({
        ...m,
        net: m.inflow - m.outflow
      }));

    res.json(cashFlow);
  } catch (error: any) {
    console.error('Cash flow error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Anomalies
app.get("/api/anomalies", (req, res) => {
  res.json({ anomalies: [], summary: { total: 0, high: 0, medium: 0 } });
});

// Unit economics
app.get("/api/unit-economics", async (req, res) => {
  try {
    await ensureDbInitialized();

    const txResult = await query(`
      SELECT t.*, c.type as category_type, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
    `);

    const transactions = txResult.rows;

    const revenue = transactions
      .filter((t: any) => t.category_type === 'income')
      .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
    const expenses = transactions
      .filter((t: any) => t.category_type === 'expense')
      .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
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

      const amount = parseFloat(t.amount) || 0;
      if (t.category_type === 'income') {
        monthlyData[monthKey].revenue += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
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
  } catch (error: any) {
    console.error('Unit economics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import CSV
app.post("/api/import", async (req, res) => {
  try {
    await ensureDbInitialized();
    const { transactions: txs } = req.body;

    // Get all categories first
    const categoriesResult = await query('SELECT * FROM categories');
    const categoriesMap = Object.fromEntries(
      categoriesResult.rows.map((c: any) => [c.name, c])
    );

    const imported: any[] = [];

    for (const t of txs) {
      const id = uuidv4();

      // Find category by name if provided, otherwise use default
      const category = t.category_name && categoriesMap[t.category_name]
        ? categoriesMap[t.category_name]
        : categoriesResult.rows[0]; // Use first category as default

      // Insert transaction
      await execute(
        'INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          id,
          t.date || new Date().toISOString().split('T')[0],
          parseFloat(t.amount) || 0,
          t.description || 'Импортированная транзакция',
          category.id,
          'completed'
        ]
      );

      imported.push({
        id,
        date: t.date || new Date().toISOString().split('T')[0],
        amount: parseFloat(t.amount) || 0,
        description: t.description || 'Импортированная транзакция',
        category_id: category.id,
        category_name: category.name,
        category_type: category.type,
        status: 'completed'
      });
    }

    res.json({ imported, count: imported.length });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Categorize
app.post("/api/categorize", async (req, res) => {
  try {
    await ensureDbInitialized();
    const { category_id } = req.body;

    // Find category by ID
    const cat = await queryOne('SELECT * FROM categories WHERE id = $1', [category_id]);

    if (cat) {
      res.json({ category_id: cat.id, category_name: cat.name });
    } else {
      // Return default category if not found
      const defaultCat = await queryOne('SELECT * FROM categories LIMIT 1');
      res.json({ category_id: defaultCat?.id, category_name: defaultCat?.name });
    }
  } catch (error: any) {
    console.error('Categorize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat with OpenAI
app.post("/api/chat", async (req, res) => {
  try {
    await ensureDbInitialized();
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.json({ response: "Пожалуйста, напишите сообщение." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.json({ response: "⚠️ OpenAI API ключ не настроен. Обновите переменные окружения." });
    }

    // Get transaction context from database
    const txResult = await query(`
      SELECT t.*, c.type as category_type, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
      LIMIT 10
    `);

    const recentTransactions = txResult.rows;

    // Calculate totals
    const allTxResult = await query(`
      SELECT t.*, c.type as category_type, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
    `);

    const allTransactions = allTxResult.rows;
    const income = allTransactions
      .filter((t: any) => t.category_type === 'income')
      .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
    const expenses = allTransactions
      .filter((t: any) => t.category_type === 'expense')
      .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

    const systemPrompt = `Ты финансовый помощник FinDir. Помогаешь анализировать финансовые данные и даёшь рекомендации.

Текущие финансовые данные:
- Всего доходов: ${income.toLocaleString('ru-RU')} руб.
- Всего расходов: ${expenses.toLocaleString('ru-RU')} руб.
- Чистая прибыль: ${(income - expenses).toLocaleString('ru-RU')} руб.

Недавние транзакции:
${recentTransactions.map((t: any) => `- ${t.date}: ${t.description} (${parseFloat(t.amount).toLocaleString('ru-RU')} руб., ${t.category_type === 'income' ? 'доход' : 'расход'})`).join('\n')}

Отвечай кратко и по делу. Дай практические советы по управлению финансами.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return res.json({
        response: `❌ Ошибка OpenAI: ${data.error.message || 'Неизвестная ошибка'}`
      });
    }

    const aiResponse = data.choices?.[0]?.message?.content || 'Не удалось получить ответ';

    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.json({ response: `Ошибка соединения: ${error.message}` });
  }
});

export default app;

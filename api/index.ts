import express from "express";
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// Try to import database manager, fallback to in-memory if it fails
let dbManager: any = null;
let useDatabase = false;

async function loadDbManager() {
  try {
    // Try to import the compiled JS version first (for Vercel/production)
    try {
      dbManager = await import("../server/db-manager.js");
      useDatabase = true;
      console.log('✅ Loaded db-manager from .js');
      return;
    } catch (e: any) {
      console.log('Trying alternative import path...');
    }

    // Fallback to TS version (for local development)
    dbManager = require("../server/db-manager");
    useDatabase = true;
    console.log('✅ Loaded db-manager from .ts');
  } catch (e: any) {
    console.warn('❌ Database manager not available:', e.message);
    console.warn('Using fallback storage instead');
    useDatabase = false;
  }
}

// Initialize db manager
loadDbManager();

// Fallback in-memory storage with sample data
let fallbackCategories: any[] = [
  { id: "cat_1", name: "Выручка", type: "income" },
  { id: "cat_2", name: "Фонд оплаты труда", type: "expense" },
  { id: "cat_3", name: "Сервисы и ПО", type: "expense" },
  { id: "cat_4", name: "Маркетинг", type: "expense" },
  { id: "cat_5", name: "Аренда офиса", type: "expense" },
  { id: "cat_6", name: "Налоги", type: "expense" },
];

// Initialize fallback transactions with sample data
function initializeFallbackData() {
  if (fallbackTransactions.length === 0) {
    const now = new Date();
    const sampleTransactions = [];

    // Generate 50 sample transactions like db-manager does
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
      const desc = isIncome ? `Оплата от клиента #${i}` : `Оплата поставщику #${i}`;

      sampleTransactions.push({
        id: `tx_${i}`,
        date,
        amount,
        description: desc,
        category_id: categoryId,
        category_name: category.name,
        category_type: category.type,
        status: 'completed'
      });
    }

    fallbackTransactions = sampleTransactions;
  }
}

let fallbackTransactions: any[] = [];

let dbInitialized = false;

// Initialize fallback data at module startup
initializeFallbackData();
console.log(`📊 Fallback storage initialized with ${fallbackTransactions.length} sample transactions`);

async function ensureDbInitialized() {
  // Ensure fallback data is always available
  if (fallbackTransactions.length === 0) {
    initializeFallbackData();
  }

  if (!dbInitialized && useDatabase && dbManager) {
    try {
      await dbManager.initializeDatabase();
      dbInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (e: any) {
      console.error('❌ Database initialization failed:', e.message);
      useDatabase = false;
      console.log('💾 Falling back to in-memory storage');
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
      console.log(`📦 Fetched ${transactions.length} transactions from database`);
      return transactions;
    }
  } catch (e) {
    console.error('❌ Database query failed:', e);
  }

  // Fallback to memory
  console.log(`💾 Using fallback storage with ${fallbackTransactions.length} transactions`);
  return fallbackTransactions;
}

async function addTransaction(date: string, amount: number, description: string, category_id: string) {
  try {
    await ensureDbInitialized();

    if (useDatabase && dbManager) {
      const category = await dbManager.queryOne('SELECT * FROM categories WHERE id = $1', [category_id]);
      const id = uuidv4();
      await dbManager.execute(
        'INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, date, amount, description, category_id, 'completed']
      );

      return {
        id,
        date,
        amount,
        description,
        category_id,
        category_name: category?.name,
        category_type: category?.type,
        status: "completed"
      };
    }
  } catch (e) {
    console.error('Database insert failed:', e);
  }

  // Fallback to memory
  const id = uuidv4();
  const category = fallbackCategories.find(c => c.id === category_id);
  const tx = {
    id,
    date,
    amount,
    description,
    category_id,
    category_name: category?.name,
    category_type: category?.type,
    status: "completed"
  };
  fallbackTransactions.unshift(tx);
  return tx;
}

async function deleteTransaction(id: string) {
  try {
    await ensureDbInitialized();

    if (useDatabase && dbManager) {
      await dbManager.execute('DELETE FROM transactions WHERE id = $1', [id]);
      console.log(`🗑️ Deleted transaction ${id} from database`);
      return { success: true, id };
    }
  } catch (e) {
    console.error('Database delete failed:', e);
  }

  // Fallback to memory
  const index = fallbackTransactions.findIndex(t => t.id === id);
  if (index !== -1) {
    fallbackTransactions.splice(index, 1);
    console.log(`🗑️ Deleted transaction ${id} from memory`);
    return { success: true, id };
  }

  return { success: false, error: 'Transaction not found' };
}

async function deleteAllTransactions() {
  try {
    await ensureDbInitialized();

    if (useDatabase && dbManager) {
      const result = await dbManager.query('SELECT COUNT(*) as count FROM transactions');
      const count = result.rows[0]?.count || 0;
      await dbManager.execute('DELETE FROM transactions');
      console.log(`🗑️ Deleted all ${count} transactions from database`);
      return { success: true, deletedCount: count };
    }
  } catch (e) {
    console.error('Database delete all failed:', e);
  }

  // Fallback to memory
  const count = fallbackTransactions.length;
  fallbackTransactions = [];
  console.log(`🗑️ Deleted all ${count} transactions from memory`);
  return { success: true, deletedCount: count };
}

async function getCategories() {
  try {
    await ensureDbInitialized();

    if (useDatabase && dbManager) {
      const result = await dbManager.query('SELECT * FROM categories ORDER BY type, name');
      return result.rows;
    }
  } catch (e) {
    console.error('Database query failed:', e);
  }

  return fallbackCategories;
}

async function addCategory(name: string, type: string) {
  if (!name || !['income', 'expense'].includes(type)) {
    throw new Error('Invalid category data');
  }

  try {
    await ensureDbInitialized();

    if (useDatabase && dbManager) {
      const id = uuidv4();
      await dbManager.execute(
        'INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)',
        [id, name, type]
      );
      return { id, name, type };
    }
  } catch (e) {
    console.error('Database insert failed:', e);
  }

  // Fallback to memory
  const id = uuidv4();
  const cat = { id, name, type };
  fallbackCategories.push(cat);
  return cat;
}

async function importTransactions(transactions: any[]) {
  try {
    await ensureDbInitialized();

    if (useDatabase && dbManager) {
      const categoriesResult = await dbManager.query('SELECT * FROM categories');
      const categoriesMap = Object.fromEntries(
        categoriesResult.rows.map((c: any) => [c.name, c])
      );

      const imported: any[] = [];
      for (const t of transactions) {
        const id = uuidv4();
        const category = t.category_name && categoriesMap[t.category_name]
          ? categoriesMap[t.category_name]
          : categoriesResult.rows[0];

        await dbManager.execute(
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
      return imported;
    }
  } catch (e) {
    console.error('Database import failed:', e);
  }

  // Fallback to memory
  const imported = transactions.map((t: any) => {
    const id = uuidv4();
    const category = t.category_name
      ? fallbackCategories.find(c => c.name === t.category_name) || fallbackCategories[0]
      : fallbackCategories[0];

    const tx = {
      id,
      date: t.date || new Date().toISOString().split('T')[0],
      amount: parseFloat(t.amount) || 0,
      description: t.description || 'Импортированная транзакция',
      category_id: category.id,
      category_name: category.name,
      category_type: category.type,
      status: 'completed'
    };

    fallbackTransactions.unshift(tx);
    return tx;
  });

  return imported;
}

// Test
app.get("/api/test", (req, res) => {
  res.json({ message: "FinDir API is running" });
});

// Health & Debug
app.get("/api/health", async (req, res) => {
  try {
    await ensureDbInitialized();
    const transactions = await getTransactions();

    res.json({
      status: "healthy",
      database: useDatabase && dbManager ? "PostgreSQL" : "Fallback (Memory)",
      transactionCount: transactions.length,
      hasData: transactions.length > 0,
      sampleData: transactions.slice(0, 2)
    });
  } catch (e: any) {
    res.json({
      status: "error",
      error: e.message,
      database: useDatabase && dbManager ? "PostgreSQL" : "Fallback (Memory)"
    });
  }
});

// Get transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await getTransactions();
    res.json(transactions);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add transaction
app.post("/api/transactions", async (req, res) => {
  try {
    const { date, amount, description, category_id } = req.body;
    const newTx = await addTransaction(date, parseFloat(amount), description, category_id);
    res.json(newTx);
  } catch (error: any) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete all transactions
app.delete("/api/transactions", async (req, res) => {
  try {
    const result = await deleteAllTransactions();
    res.json(result);
  } catch (error: any) {
    console.error('Delete all transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteTransaction(id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create category
app.post("/api/categories", async (req, res) => {
  try {
    const { name, type } = req.body;
    const cat = await addCategory(name, type);
    res.json(cat);
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Stats
app.get("/api/stats", async (req, res) => {
  try {
    const transactions = await getTransactions();
    console.log(`📈 /api/stats: Processing ${transactions.length} transactions`);

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

    const statsResponse = {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      chartData,
      expenseDistribution,
      budgetProgress: []
    };

    console.log(`✅ Stats: income=${income}, expenses=${expenses}, chartPoints=${chartData.length}`);
    res.json(statsResponse);
  } catch (error: any) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// P&L
app.get("/api/reports/p-l", async (req, res) => {
  try {
    const transactions = await getTransactions();

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
    const transactions = await getTransactions();
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
    const transactions = await getTransactions();

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
    const { transactions: txs, autoCategory } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    // If autoCategory is enabled and API key exists, use AI categorization
    if (autoCategory && apiKey) {
      const categories = await getCategories();
      const categoryNames = categories.map((c: any) => `${c.name} (${c.type})`).join(', ');

      for (const tx of txs) {
        if (!tx.category_name) {
          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'user',
                    content: `Проанализируй описание финансовой транзакции и определи категорию.

Описание: "${tx.description}"
Сумма: ${tx.amount}

Доступные категории: ${categoryNames}

Ответь ТОЛЬКО названием категории из списка, без кавычек и доп. текста. Например: Маркетинг`
                  }
                ],
                temperature: 0.3,
                max_tokens: 50
              })
            });

            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
              const categoryName = data.choices[0].message.content.trim();
              const found = categories.find((c: any) => c.name.toLowerCase() === categoryName.toLowerCase());
              if (found) {
                tx.category_name = found.name;
              }
            }
          } catch (e) {
            console.warn('AI categorization failed for:', tx.description);
          }
        }
      }
    }

    const imported = await importTransactions(txs);
    res.json({ imported, count: imported.length });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Categorize
app.post("/api/categorize", async (req, res) => {
  try {
    const { category_id } = req.body;
    const categories = await getCategories();
    const cat = categories.find(c => c.id === category_id) || categories[0];
    res.json({ category_id: cat?.id, category_name: cat?.name });
  } catch (error: any) {
    console.error('Categorize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI-powered categorization
app.post("/api/categorize-ai", async (req, res) => {
  try {
    const { description, amount } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback if no API key
      const categories = await getCategories();
      return res.json({
        category_name: categories[0]?.name || 'Unknown',
        category_type: 'expense',
        confidence: 0.5
      });
    }

    const categories = await getCategories();
    const categoryNames = categories.map((c: any) => `${c.name} (${c.type})`).join(', ');

    const prompt = `Проанализируй описание финансовой транзакции и определи категорию.

Описание: "${description}"
Сумма: ${amount || 'неизвестна'}

Доступные категории: ${categoryNames}

Ответь в формате JSON:
{
  "category": "название категории из списка",
  "type": "income или expense",
  "confidence": число от 0 до 1 (уверенность в определении)
}

Правила:
- Для расходов (expense): Фонд оплаты труда, Сервисы и ПО, Маркетинг, Аренда офиса, Налоги
- Для доходов (income): Выручка
- Анализируй ключевые слова: зарплата, ФОТ, софт, сервис, реклама, маркетинг, аренда, налог, доход, оплата от клиента
- Будь точен в определении категории`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI error:', data.error);
      // Fallback to first category
      const fallback = categories[0];
      return res.json({
        category_name: fallback?.name || 'Unknown',
        category_type: fallback?.type || 'expense',
        confidence: 0.5
      });
    }

    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(aiResponse);

    // Validate and ensure category exists
    const selectedCategory = categories.find((c: any) => c.name === parsed.category);
    const category = selectedCategory || categories[0];

    res.json({
      category_name: category.name,
      category_type: category.type,
      confidence: parsed.confidence || 0.8
    });
  } catch (error: any) {
    console.error('AI Categorize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Intelligent table analysis - AI analyzes entire table and categorizes automatically
app.post("/api/analyze-table", async (req, res) => {
  try {
    const { tableData } = req.body;

    if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
      return res.status(400).json({ error: 'Table data is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    const categories = await getCategories();
    const categoryList = categories.map((c: any) => `- ${c.name} (${c.type})`).join('\n');

    // Prepare table data for AI analysis
    const tableDescription = tableData.slice(0, 20).map((row: any, idx: number) => {
      return Object.entries(row)
        .map(([key, val]) => `${key}: ${val}`)
        .join(' | ');
    }).join('\n');

    const prompt = `Ты финансовый аналитик. Проанализируй таблицу финансовых данных и распредели каждую строку по категориям.

ТАБЛИЦА ДАННЫХ:
${tableDescription}

ДОСТУПНЫЕ КАТЕГОРИИ И ИХ ТИПЫ:
${categoryList}

ПРАВИЛА КАТЕГОРИЗАЦИИ:
- Доходы (income): Выручка от клиентов, продажи, платежи за услуги
- Расходы (expense): Зарплата, софт, реклама, маркетинг, аренда, налоги, комиссии

ВАЖНЫЕ КЛЮЧЕВЫЕ СЛОВА:
Зарплата/ФОТ/Заработная плата → Фонд оплаты труда (expense)
Софт/SaaS/подписка/Slack/GitHub → Сервисы и ПО (expense)
Реклама/Яндекс.Директ/Facebook → Маркетинг (expense)
Аренда/Оренда → Аренда офиса (expense)
Налог/НДС/1С → Налоги (expense)
Платеж от клиента/Счет/Доход → Выручка (income)

Ответь в формате JSON массив объектов:
[
  {
    "row_index": номер строки,
    "description": описание из таблицы или объединенные поля,
    "amount": сумма,
    "date": дата,
    "type": "income" или "expense",
    "category": "название категории из списка",
    "confidence": число от 0 до 1
  }
]

Анализируй каждую строку внимательно!`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const aiResponse = data.choices?.[0]?.message?.content || '[]';

    // Extract JSON from markdown code blocks if present
    let jsonStr = aiResponse;
    const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const analyzed = JSON.parse(jsonStr);

    // Validate and normalize the results
    const normalized = analyzed.map((item: any) => {
      const cat = categories.find((c: any) => c.name === item.category) || categories[0];
      return {
        date: item.date || new Date().toISOString().split('T')[0],
        amount: parseFloat(String(item.amount)) || 0,
        description: item.description || 'Импортированная транзакция',
        category_name: cat.name,
        type: cat.type,
        confidence: item.confidence || 0.7
      };
    }).filter((t: any) => t.amount > 0);

    res.json({
      analyzed: normalized,
      count: normalized.length,
      summary: {
        total_income: normalized.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0),
        total_expenses: normalized.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
      }
    });
  } catch (error: any) {
    console.error('Table analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat with OpenAI
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.json({ response: "Пожалуйста, напишите сообщение." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.json({ response: "⚠️ OpenAI API ключ не настроен. Обновите переменные окружения." });
    }

    const allTransactions = await getTransactions();
    const recentTransactions = allTransactions.slice(0, 10);
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

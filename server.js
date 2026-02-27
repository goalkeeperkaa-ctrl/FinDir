"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var vite_1 = require("vite");
var db_manager_1 = require("./server/db-manager");
var openai_1 = require("openai");
var uuid_1 = require("uuid");
var app = (0, express_1.default)();
var PORT = parseInt(process.env.PORT || '3000');
app.use(express_1.default.json());
// Simple test endpoint (no database)
app.get("/api/test", function (req, res) {
    res.json({
        message: "Server is running",
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? "Vercel" : "Local"
    });
});
// Health check endpoint
app.get("/api/health", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ensureDbInitialized()];
            case 1:
                _a.sent();
                res.json({
                    status: "healthy",
                    timestamp: new Date().toISOString(),
                    database: "connected",
                    environment: {
                        NODE_ENV: process.env.NODE_ENV,
                        VERCEL: process.env.VERCEL ? "yes" : "no",
                        DATABASE_URL_SET: process.env.DATABASE_URL ? "yes" : "no",
                        DATABASE_TYPE: process.env.DATABASE_URL ? "postgresql" : "sqlite"
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({
                    status: "unhealthy",
                    timestamp: new Date().toISOString(),
                    database: "error",
                    error: String(error_1),
                    environment: {
                        NODE_ENV: process.env.NODE_ENV,
                        VERCEL: process.env.VERCEL ? "yes" : "no",
                        DATABASE_URL_SET: process.env.DATABASE_URL ? "yes" : "no"
                    }
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- API Routes ---
// Get all transactions
app.get("/api/transactions", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, db_manager_1.query)("\n      SELECT t.*, c.name as category_name, c.type as category_type\n      FROM transactions t\n      LEFT JOIN categories c ON t.category_id = c.id\n      ORDER BY t.date DESC\n    ")];
            case 1:
                result = _a.sent();
                res.json(result.rows);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error("Error fetching transactions:", error_2);
                res.status(500).json({ error: "Failed to fetch transactions" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get all categories
app.get("/api/categories", withDatabase(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, db_manager_1.query)('SELECT * FROM categories ORDER BY name')];
            case 1:
                result = _a.sent();
                res.json(result.rows);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error("Error fetching categories:", error_3);
                res.status(500).json({ error: "Failed to fetch categories" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }));
// Create a new category
app.post("/api/categories", withDatabase(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name, type, id, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, name = _a.name, type = _a.type;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                if (!name || !type || !['income', 'expense'].includes(type)) {
                    return [2 /*return*/, res.status(400).json({ error: "Name and type (income/expense) are required" })];
                }
                id = (0, uuid_1.v4)();
                return [4 /*yield*/, (0, db_manager_1.execute)('INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)', [id, name, type])];
            case 2:
                _b.sent();
                res.json({ id: id, name: name, type: type });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _b.sent();
                console.error("Error creating category:", error_4);
                res.status(500).json({ error: "Failed to create category" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); }));
// Add a transaction
app.post("/api/transactions", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, date, amount, description, category_id, id, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, date = _a.date, amount = _a.amount, description = _a.description, category_id = _a.category_id;
                id = (0, uuid_1.v4)();
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, db_manager_1.execute)('INSERT INTO transactions (id, date, amount, description, category_id) VALUES ($1, $2, $3, $4, $5)', [id, date, amount, description, category_id || null])];
            case 2:
                _b.sent();
                res.json({ id: id, date: date, amount: amount, description: description, category_id: category_id });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _b.sent();
                console.error("Error adding transaction:", error_5);
                res.status(500).json({ error: "Failed to add transaction" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get stats for dashboard
app.get("/api/stats", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var incomeResult, expenseResult, income, expenses, monthlyResult, monthlyData, currentMonth, expenseDistResult, expenseDistribution, BUDGET_LIMITS_1, budgetProgress, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, (0, db_manager_1.queryOne)("SELECT SUM(amount) as total FROM transactions WHERE category_id IN (SELECT id FROM categories WHERE type = 'income')")];
            case 1:
                incomeResult = _a.sent();
                return [4 /*yield*/, (0, db_manager_1.queryOne)("SELECT SUM(amount) as total FROM transactions WHERE category_id IN (SELECT id FROM categories WHERE type = 'expense')")];
            case 2:
                expenseResult = _a.sent();
                income = (incomeResult === null || incomeResult === void 0 ? void 0 : incomeResult.total) || 0;
                expenses = (expenseResult === null || expenseResult === void 0 ? void 0 : expenseResult.total) || 0;
                return [4 /*yield*/, (0, db_manager_1.query)("\n      SELECT SUBSTRING(t.date, 1, 7) as month,\n             SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as income,\n             SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as expense\n      FROM transactions t\n      JOIN categories c ON t.category_id = c.id\n      GROUP BY SUBSTRING(t.date, 1, 7)\n      ORDER BY month ASC\n      LIMIT 12\n    ")];
            case 3:
                monthlyResult = _a.sent();
                monthlyData = monthlyResult.rows;
                currentMonth = new Date().toISOString().split('T')[0].slice(0, 7);
                return [4 /*yield*/, (0, db_manager_1.query)("\n      SELECT c.name, SUM(t.amount) as value\n      FROM transactions t\n      JOIN categories c ON t.category_id = c.id\n      WHERE c.type = 'expense' AND SUBSTRING(t.date, 1, 7) = $1\n      GROUP BY c.name\n      ORDER BY value DESC\n    ", [currentMonth])];
            case 4:
                expenseDistResult = _a.sent();
                expenseDistribution = expenseDistResult.rows;
                BUDGET_LIMITS_1 = {
                    'Фонд оплаты труда': 600000,
                    'Сервисы и ПО': 80000,
                    'Маркетинг': 200000,
                    'Аренда офиса': 150000,
                    'Налоги': 100000
                };
                budgetProgress = expenseDistribution.map(function (item) { return ({
                    category: item.name,
                    spent: item.value,
                    limit: BUDGET_LIMITS_1[item.name] || 100000,
                    percentage: Math.min(100, (item.value / (BUDGET_LIMITS_1[item.name] || 100000)) * 100)
                }); }).sort(function (a, b) { return b.percentage - a.percentage; });
                res.json({
                    totalIncome: income,
                    totalExpenses: expenses,
                    netProfit: income - expenses,
                    chartData: monthlyData,
                    expenseDistribution: expenseDistribution,
                    budgetProgress: budgetProgress
                });
                return [3 /*break*/, 6];
            case 5:
                error_6 = _a.sent();
                console.error("Error fetching stats:", error_6);
                res.status(500).json({ error: "Failed to fetch stats" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// AI Categorization Endpoint
app.post("/api/categorize", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, description, amount, openai, categoriesResult, categories, categoriesJson, prompt_1, result, categoryId_1, category, defaultCat, error_7;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, description = _a.description, amount = _a.amount;
                if (!process.env.OPENAI_API_KEY) {
                    return [2 /*return*/, res.status(500).json({ error: "OpenAI API Key not configured" })];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
                return [4 /*yield*/, (0, db_manager_1.query)('SELECT id, name, type FROM categories')];
            case 2:
                categoriesResult = _c.sent();
                categories = categoriesResult.rows;
                categoriesJson = JSON.stringify(categories);
                prompt_1 = "\n      Analyze the following transaction description and amount:\n      Description: \"".concat(description, "\"\n      Amount: ").concat(amount, "\n\n      Available Categories:\n      ").concat(categoriesJson, "\n\n      Task: Select the most appropriate category ID for this transaction.\n      Return ONLY the category ID as a plain string. Do not include any other text or JSON formatting.\n      If no category fits well, return the ID for \"\u0421\u0435\u0440\u0432\u0438\u0441\u044B \u0438 \u041F\u041E\" (or similar general expense) if it's an expense, or \"\u0412\u044B\u0440\u0443\u0447\u043A\u0430\" if it's income.\n    ");
                return [4 /*yield*/, openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: 'user', content: prompt_1 }],
                    })];
            case 3:
                result = _c.sent();
                categoryId_1 = (_b = result.choices[0].message.content) === null || _b === void 0 ? void 0 : _b.trim();
                category = categories.find(function (c) { return c.id === categoryId_1; });
                if (category) {
                    res.json({ category_id: category.id, category_name: category.name });
                }
                else {
                    defaultCat = amount > 0 ? categories.find(function (c) { return c.type === 'income'; }) : categories.find(function (c) { return c.type === 'expense'; });
                    res.json({ category_id: defaultCat === null || defaultCat === void 0 ? void 0 : defaultCat.id, category_name: defaultCat === null || defaultCat === void 0 ? void 0 : defaultCat.name });
                }
                return [3 /*break*/, 5];
            case 4:
                error_7 = _c.sent();
                console.error("AI Categorization Error:", error_7);
                res.status(500).json({ error: "Failed to categorize transaction" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// P&L Report Endpoint
app.get("/api/reports/p-l", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, data, income, expenses, totalIncome, totalExpenses, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, db_manager_1.query)("\n      SELECT\n        c.name as category,\n        c.type,\n        SUM(t.amount) as total_amount,\n        COUNT(t.id) as transaction_count\n      FROM transactions t\n      LEFT JOIN categories c ON t.category_id = c.id\n      GROUP BY c.id, c.name, c.type\n      ORDER BY c.type DESC, total_amount DESC\n    ")];
            case 1:
                result = _a.sent();
                data = result.rows;
                income = data.filter(function (row) { return row.type === 'income'; });
                expenses = data.filter(function (row) { return row.type === 'expense'; });
                totalIncome = income.reduce(function (sum, row) { return sum + (row.total_amount || 0); }, 0);
                totalExpenses = expenses.reduce(function (sum, row) { return sum + (row.total_amount || 0); }, 0);
                res.json({
                    income: income,
                    expenses: expenses,
                    totalIncome: totalIncome,
                    totalExpenses: totalExpenses,
                    netProfit: totalIncome - totalExpenses,
                    profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                console.error("P&L Report Error:", error_8);
                res.status(500).json({ error: "Failed to generate P&L report" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Bulk Import Transactions Endpoint
app.post("/api/import", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var transactions, imported, errors, _i, _a, _b, index, tx, date, amount, description, category_id, catResult, id, e_1, error_9;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 9, , 10]);
                transactions = req.body.transactions;
                if (!Array.isArray(transactions) || transactions.length === 0) {
                    return [2 /*return*/, res.status(400).json({ error: "Invalid or empty transactions array" })];
                }
                imported = 0;
                errors = [];
                _i = 0, _a = transactions.entries();
                _c.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 8];
                _b = _a[_i], index = _b[0], tx = _b[1];
                _c.label = 2;
            case 2:
                _c.trys.push([2, 6, , 7]);
                date = tx.date || new Date().toISOString().split('T')[0];
                amount = parseFloat(tx.amount);
                description = tx.description || 'Импортированная транзакция';
                category_id = tx.category_id;
                if (!date || isNaN(amount)) {
                    errors.push("\u0421\u0442\u0440\u043E\u043A\u0430 ".concat(index + 1, ": \u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 (\u0434\u0430\u0442\u0430/\u0441\u0443\u043C\u043C\u0430)"));
                    return [3 /*break*/, 7];
                }
                if (!(!category_id && tx.category_name)) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, db_manager_1.query)('SELECT id FROM categories WHERE LOWER(name) LIKE LOWER($1)', ["%".concat(tx.category_name, "%")])];
            case 3:
                catResult = _c.sent();
                if (catResult.rows.length > 0) {
                    category_id = catResult.rows[0].id;
                }
                _c.label = 4;
            case 4:
                id = (0, uuid_1.v4)();
                return [4 /*yield*/, (0, db_manager_1.execute)('INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES ($1, $2, $3, $4, $5, $6)', [id, date, amount, description, category_id || null, 'cleared'])];
            case 5:
                _c.sent();
                imported++;
                return [3 /*break*/, 7];
            case 6:
                e_1 = _c.sent();
                errors.push("\u0421\u0442\u0440\u043E\u043A\u0430 ".concat(index + 1, ": ").concat(String(e_1)));
                return [3 /*break*/, 7];
            case 7:
                _i++;
                return [3 /*break*/, 1];
            case 8:
                res.json({
                    imported: imported,
                    errors: errors.length > 0 ? errors : undefined,
                    total: transactions.length
                });
                return [3 /*break*/, 10];
            case 9:
                error_9 = _c.sent();
                console.error("Import Error:", error_9);
                res.status(500).json({ error: "Failed to import transactions" });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
// Anomaly Detection Endpoint
app.get("/api/anomalies", withDatabase(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, transactions, anomalies_1, byCategory_1, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, db_manager_1.query)("\n      SELECT\n        t.id, t.date, t.amount, t.description, c.name as category,\n        c.type, c.id as category_id\n      FROM transactions t\n      LEFT JOIN categories c ON t.category_id = c.id\n      WHERE c.type = 'expense'\n      ORDER BY t.date DESC\n      LIMIT 200\n    ")];
            case 1:
                result = _a.sent();
                transactions = result.rows;
                anomalies_1 = [];
                byCategory_1 = new Map();
                transactions.forEach(function (tx) {
                    if (!byCategory_1.has(tx.category)) {
                        byCategory_1.set(tx.category, []);
                    }
                    byCategory_1.get(tx.category).push(tx.amount);
                });
                // Detect anomalies per category (amounts > 2 std devs from mean)
                transactions.forEach(function (tx) {
                    var amounts = byCategory_1.get(tx.category) || [];
                    if (amounts.length < 3)
                        return;
                    var mean = amounts.reduce(function (a, b) { return a + b; }) / amounts.length;
                    var variance = amounts.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }) / amounts.length;
                    var stdDev = Math.sqrt(variance);
                    var zScore = Math.abs((tx.amount - mean) / (stdDev || 1));
                    if (zScore > 2) {
                        anomalies_1.push({
                            id: tx.id,
                            date: tx.date,
                            amount: tx.amount,
                            description: tx.description,
                            category: tx.category,
                            zscore: parseFloat(zScore.toFixed(2)),
                            severity: zScore > 3 ? 'high' : 'medium',
                            reason: tx.amount > mean ? 'выше обычного' : 'ниже обычного'
                        });
                    }
                });
                res.json({
                    total: transactions.length,
                    anomalies: anomalies_1.sort(function (a, b) { return b.zscore - a.zscore; }),
                    summary: {
                        high_severity: anomalies_1.filter(function (a) { return a.severity === 'high'; }).length,
                        medium_severity: anomalies_1.filter(function (a) { return a.severity === 'medium'; }).length
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_10 = _a.sent();
                console.error("Anomaly detection error:", error_10);
                res.status(500).json({ error: "Failed to detect anomalies" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }));
// Unit Economics Endpoint
app.get("/api/unit-economics", withDatabase(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var incomeResult, expenseResult, revenue, totalExpense, monthlyResult, monthlyData, currentMonth, previousMonth, profit, marginPercent, avgMonthlyExpense, runway, prevRevenue, revenueMoM, prevExpense, expenseMoM, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, db_manager_1.queryOne)("SELECT SUM(amount) as total FROM transactions WHERE category_id IN (SELECT id FROM categories WHERE type = 'income')")];
            case 1:
                incomeResult = _a.sent();
                return [4 /*yield*/, (0, db_manager_1.queryOne)("SELECT SUM(amount) as total FROM transactions WHERE category_id IN (SELECT id FROM categories WHERE type = 'expense')")];
            case 2:
                expenseResult = _a.sent();
                revenue = (incomeResult === null || incomeResult === void 0 ? void 0 : incomeResult.total) || 0;
                totalExpense = (expenseResult === null || expenseResult === void 0 ? void 0 : expenseResult.total) || 0;
                return [4 /*yield*/, (0, db_manager_1.query)("\n      SELECT SUBSTRING(t.date, 1, 7) as month,\n             SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as income,\n             SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as expense\n      FROM transactions t\n      LEFT JOIN categories c ON t.category_id = c.id\n      GROUP BY SUBSTRING(t.date, 1, 7)\n      ORDER BY month DESC\n      LIMIT 12\n    ")];
            case 3:
                monthlyResult = _a.sent();
                monthlyData = monthlyResult.rows;
                currentMonth = monthlyData[0];
                previousMonth = monthlyData[1];
                profit = revenue - totalExpense;
                marginPercent = revenue > 0 ? (profit / revenue * 100).toFixed(2) : 0;
                avgMonthlyExpense = monthlyData.length > 0
                    ? monthlyData.reduce(function (sum, m) { return sum + (m.expense || 0); }, 0) / monthlyData.length
                    : 0;
                runway = avgMonthlyExpense > 0 ? Math.floor(profit / avgMonthlyExpense) : 0;
                prevRevenue = (previousMonth === null || previousMonth === void 0 ? void 0 : previousMonth.income) || 0;
                revenueMoM = prevRevenue > 0
                    ? ((((currentMonth === null || currentMonth === void 0 ? void 0 : currentMonth.income) || 0) - prevRevenue) / prevRevenue * 100).toFixed(2)
                    : 0;
                prevExpense = (previousMonth === null || previousMonth === void 0 ? void 0 : previousMonth.expense) || 0;
                expenseMoM = prevExpense > 0
                    ? ((((currentMonth === null || currentMonth === void 0 ? void 0 : currentMonth.expense) || 0) - prevExpense) / prevExpense * 100).toFixed(2)
                    : 0;
                res.json({
                    revenue: parseFloat(revenue.toFixed(2)),
                    expenses: parseFloat(totalExpense.toFixed(2)),
                    profit: parseFloat(profit.toFixed(2)),
                    margin_percent: marginPercent,
                    burn_rate: parseFloat(avgMonthlyExpense.toFixed(2)),
                    runway_months: runway,
                    growth: {
                        revenue_mom: revenueMoM,
                        expense_mom: expenseMoM
                    },
                    monthly_data: monthlyData.slice(0, 6).map(function (m) { return ({
                        month: m.month,
                        income: parseFloat((m.income || 0).toFixed(2)),
                        expense: parseFloat((m.expense || 0).toFixed(2)),
                        profit: parseFloat(((m.income || 0) - (m.expense || 0)).toFixed(2))
                    }); })
                });
                return [3 /*break*/, 5];
            case 4:
                error_11 = _a.sent();
                console.error("Unit economics error:", error_11);
                res.status(500).json({ error: "Failed to calculate unit economics" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); }));
// Cash Flow Report Endpoint
app.get("/api/reports/cash-flow", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, data, cashFlow, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, db_manager_1.query)("\n      SELECT\n        SUBSTRING(t.date, 1, 7) as month,\n        SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as inflows,\n        SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as outflows,\n        COUNT(CASE WHEN c.type = 'income' THEN 1 END) as income_count,\n        COUNT(CASE WHEN c.type = 'expense' THEN 1 END) as expense_count\n      FROM transactions t\n      LEFT JOIN categories c ON t.category_id = c.id\n      GROUP BY SUBSTRING(t.date, 1, 7)\n      ORDER BY month ASC\n    ")];
            case 1:
                result = _a.sent();
                data = result.rows;
                cashFlow = data.map(function (row) { return ({
                    month: row.month,
                    inflows: row.inflows || 0,
                    outflows: row.outflows || 0,
                    netFlow: (row.inflows || 0) - (row.outflows || 0),
                    income_count: row.income_count,
                    expense_count: row.expense_count
                }); });
                res.json(cashFlow);
                return [3 /*break*/, 3];
            case 2:
                error_12 = _a.sent();
                console.error("Cash Flow Report Error:", error_12);
                res.status(500).json({ error: "Failed to generate cash flow report" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// AI Chat Endpoint
app.post("/api/chat", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var message, openai, txResult, transactions, context, systemPrompt, result, response, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                message = req.body.message;
                if (!process.env.OPENAI_API_KEY) {
                    return [2 /*return*/, res.status(500).json({ error: "OpenAI API Key not configured" })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
                return [4 /*yield*/, (0, db_manager_1.query)("\n      SELECT t.date, t.amount, t.description, c.name as category, c.type\n      FROM transactions t\n      LEFT JOIN categories c ON t.category_id = c.id\n      ORDER BY t.date DESC LIMIT 50\n    ")];
            case 2:
                txResult = _a.sent();
                transactions = txResult.rows;
                context = JSON.stringify(transactions);
                systemPrompt = "\u0422\u044B \u2014 'AFM', \u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0444\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u043E\u0439 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B.\n        \u0423 \u0442\u0435\u0431\u044F \u0435\u0441\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C \u0444\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u044B\u043C \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F\u043C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 JSON.\n        \u041E\u0442\u0432\u0435\u0447\u0430\u0439 \u043D\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043E \u0444\u0438\u043D\u0430\u043D\u0441\u0430\u0445, \u0442\u0440\u0430\u0442\u0430\u0445 \u0438 \u043F\u0440\u0438\u0431\u044B\u043B\u044C\u043D\u043E\u0441\u0442\u0438.\n        \u0422\u0432\u043E\u0439 \u0442\u043E\u043D: \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439, \u043B\u0430\u043A\u043E\u043D\u0438\u0447\u043D\u044B\u0439, \u0444\u0443\u0442\u0443\u0440\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0439.\n        \u042F\u0437\u044B\u043A \u043E\u0442\u0432\u0435\u0442\u043E\u0432: \u0420\u0443\u0441\u0441\u043A\u0438\u0439.\n        \u0412\u0430\u043B\u044E\u0442\u0430: \u0420\u0443\u0431\u043B\u0438 (\u20BD).\n\n        \u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0434\u0430\u043D\u043D\u044B\u0445: ".concat(context);
                return [4 /*yield*/, openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: message }
                        ],
                    })];
            case 3:
                result = _a.sent();
                response = result.choices[0].message.content;
                res.json({ response: response });
                return [3 /*break*/, 5];
            case 4:
                error_13 = _a.sent();
                console.error("AI Error:", error_13);
                res.status(500).json({ error: "Failed to process AI request" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Database initialization state
var dbInitialized = false;
var dbInitPromise = null;
var dbError = null;
function ensureDbInitialized() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            if (dbInitialized)
                return [2 /*return*/];
            if (dbInitPromise)
                return [2 /*return*/, dbInitPromise]; // Return existing promise if already initializing
            dbInitPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                var error_14;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, (0, db_manager_1.initializeDatabase)()];
                        case 1:
                            _a.sent();
                            dbInitialized = true;
                            console.log("✅ Database initialized successfully");
                            return [3 /*break*/, 3];
                        case 2:
                            error_14 = _a.sent();
                            dbError = error_14;
                            console.error("❌ Database initialization failed:", error_14);
                            throw error_14;
                        case 3: return [2 /*return*/];
                    }
                });
            }); })();
            return [2 /*return*/, dbInitPromise];
        });
    });
}
// Helper function to handle endpoints that need database
function withDatabase(handler) {
    var _this = this;
    return function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var error_15;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, ensureDbInitialized()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, handler(req, res)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_15 = _a.sent();
                    console.error("Database error:", error_15);
                    if (!res.headersSent) {
                        res.status(500).json({ error: "Database not available", details: String(error_15) });
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
}
// Start server (for local development only)
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var vite_2, viteError_1, server_1, error_16;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!!process.env.VERCEL) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, vite_1.createServer)({
                            server: { middlewareMode: true },
                            appType: "spa",
                        })];
                case 2:
                    vite_2 = _a.sent();
                    // Skip Vite middleware for API routes
                    app.use(function (req, res, next) {
                        if (req.url.startsWith('/api/')) {
                            return next();
                        }
                        return vite_2.middlewares(req, res, next);
                    });
                    return [3 /*break*/, 4];
                case 3:
                    viteError_1 = _a.sent();
                    console.warn("Vite initialization failed, skipping:", viteError_1);
                    return [3 /*break*/, 4];
                case 4:
                    // Only start listening if not on Vercel (Vercel handles the HTTP server)
                    if (!process.env.VERCEL) {
                        server_1 = app.listen(PORT, "0.0.0.0", function () {
                            console.log("Server running on http://localhost:".concat(PORT));
                        });
                        // Graceful shutdown
                        process.on("SIGTERM", function () {
                            console.log("SIGTERM received, shutting down gracefully");
                            server_1.close(function () {
                                process.exit(0);
                            });
                        });
                    }
                    else {
                        console.log("Running on Vercel serverless environment");
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_16 = _a.sent();
                    console.error("Failed to start server:", error_16);
                    if (!process.env.VERCEL) {
                        process.exit(1);
                    }
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Start async initialization (don't block module loading)
start().catch(function (error) {
    console.error("Unhandled error in start():", error);
    if (!process.env.VERCEL) {
        process.exit(1);
    }
});
exports.default = app;

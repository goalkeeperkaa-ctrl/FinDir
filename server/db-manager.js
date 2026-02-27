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
exports.initializeDatabase = initializeDatabase;
exports.query = query;
exports.queryOne = queryOne;
exports.execute = execute;
exports.closeConnection = closeConnection;
exports.getDbType = getDbType;
var pg_1 = require("pg");
var better_sqlite3_1 = require("better-sqlite3");
var path_1 = require("path");
var fs_1 = require("fs");
var Client = pg_1.default.Client;
var dbType = 'sqlite';
var sqliteDb = null;
var postgresClient = null;
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var result, categories, _i, categories_1, cat, dataDir, count, checkEnglish, insertCategory_1, categories, insertTx, now, i, isIncome, amount, date, cat, desc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!process.env.DATABASE_URL) return [3 /*break*/, 9];
                    // PostgreSQL mode
                    dbType = 'postgresql';
                    postgresClient = new Client({
                        connectionString: process.env.DATABASE_URL,
                        ssl: { rejectUnauthorized: false }
                    });
                    return [4 /*yield*/, postgresClient.connect()];
                case 1:
                    _a.sent();
                    // Create tables if they don't exist (separate queries)
                    return [4 /*yield*/, postgresClient.query("\n      CREATE TABLE IF NOT EXISTS categories (\n        id TEXT PRIMARY KEY,\n        name TEXT NOT NULL,\n        type TEXT NOT NULL CHECK(type IN ('income', 'expense'))\n      );\n    ")];
                case 2:
                    // Create tables if they don't exist (separate queries)
                    _a.sent();
                    return [4 /*yield*/, postgresClient.query("\n      CREATE TABLE IF NOT EXISTS transactions (\n        id TEXT PRIMARY KEY,\n        date TEXT NOT NULL,\n        amount REAL NOT NULL,\n        description TEXT NOT NULL,\n        category_id TEXT,\n        status TEXT DEFAULT 'pending',\n        FOREIGN KEY (category_id) REFERENCES categories(id)\n      );\n    ")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postgresClient.query('SELECT count(*) as count FROM categories')];
                case 4:
                    result = _a.sent();
                    if (!(parseInt(result.rows[0].count) === 0)) return [3 /*break*/, 8];
                    categories = [
                        { id: 'cat_1', name: 'Выручка', type: 'income' },
                        { id: 'cat_2', name: 'Фонд оплаты труда', type: 'expense' },
                        { id: 'cat_3', name: 'Сервисы и ПО', type: 'expense' },
                        { id: 'cat_4', name: 'Маркетинг', type: 'expense' },
                        { id: 'cat_5', name: 'Аренда офиса', type: 'expense' },
                        { id: 'cat_6', name: 'Налоги', type: 'expense' },
                    ];
                    _i = 0, categories_1 = categories;
                    _a.label = 5;
                case 5:
                    if (!(_i < categories_1.length)) return [3 /*break*/, 8];
                    cat = categories_1[_i];
                    return [4 /*yield*/, postgresClient.query('INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)', [cat.id, cat.name, cat.type])];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log('✅ PostgreSQL connected and initialized');
                    return [3 /*break*/, 10];
                case 9:
                    // SQLite mode (default)
                    dbType = 'sqlite';
                    dataDir = path_1.default.join(process.cwd(), 'data');
                    if (!fs_1.default.existsSync(dataDir)) {
                        fs_1.default.mkdirSync(dataDir);
                    }
                    sqliteDb = new better_sqlite3_1.default(path_1.default.join(dataDir, 'finance.db'));
                    sqliteDb.exec("\n      CREATE TABLE IF NOT EXISTS categories (\n        id TEXT PRIMARY KEY,\n        name TEXT NOT NULL,\n        type TEXT NOT NULL CHECK(type IN ('income', 'expense'))\n      );\n\n      CREATE TABLE IF NOT EXISTS transactions (\n        id TEXT PRIMARY KEY,\n        date TEXT NOT NULL,\n        amount REAL NOT NULL,\n        description TEXT NOT NULL,\n        category_id TEXT,\n        status TEXT DEFAULT 'pending',\n        FOREIGN KEY (category_id) REFERENCES categories(id)\n      );\n    ");
                    count = sqliteDb.prepare('SELECT count(*) as count FROM categories').get();
                    checkEnglish = sqliteDb.prepare("SELECT count(*) as count FROM categories WHERE name = 'Revenue'").get();
                    if (count.count === 0 || checkEnglish.count > 0) {
                        sqliteDb.exec('DELETE FROM transactions; DELETE FROM categories;');
                        insertCategory_1 = sqliteDb.prepare('INSERT INTO categories (id, name, type) VALUES (?, ?, ?)');
                        categories = [
                            { id: 'cat_1', name: 'Выручка', type: 'income' },
                            { id: 'cat_2', name: 'Фонд оплаты труда', type: 'expense' },
                            { id: 'cat_3', name: 'Сервисы и ПО', type: 'expense' },
                            { id: 'cat_4', name: 'Маркетинг', type: 'expense' },
                            { id: 'cat_5', name: 'Аренда офиса', type: 'expense' },
                            { id: 'cat_6', name: 'Налоги', type: 'expense' },
                        ];
                        categories.forEach(function (c) { return insertCategory_1.run(c.id, c.name, c.type); });
                        insertTx = sqliteDb.prepare('INSERT INTO transactions (id, date, amount, description, category_id, status) VALUES (?, ?, ?, ?, ?, ?)');
                        now = new Date();
                        for (i = 0; i < 50; i++) {
                            isIncome = Math.random() > 0.7;
                            amount = isIncome ? Math.floor(Math.random() * 1000000) + 500000 : Math.floor(Math.random() * 200000) + 10000;
                            date = new Date(now.getTime() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
                            cat = isIncome ? 'cat_1' : ['cat_2', 'cat_3', 'cat_4', 'cat_5', 'cat_6'][Math.floor(Math.random() * 5)];
                            desc = isIncome ? "\u041E\u043F\u043B\u0430\u0442\u0430 \u043E\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u0430 #".concat(i) : "\u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0443 #".concat(i);
                            insertTx.run("tx_".concat(i), date, amount, desc, cat, 'cleared');
                        }
                    }
                    console.log('✅ SQLite initialized');
                    _a.label = 10;
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Unified query interface
function query(sql, params) {
    return __awaiter(this, void 0, void 0, function () {
        var result, sqliteSql_1, stmt, rows, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    if (!(dbType === 'postgresql')) return [3 /*break*/, 2];
                    if (!postgresClient)
                        throw new Error('PostgreSQL client not initialized');
                    return [4 /*yield*/, postgresClient.query(sql, params)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, { rows: result.rows }];
                case 2:
                    if (!sqliteDb)
                        throw new Error('SQLite database not initialized');
                    sqliteSql_1 = sql;
                    if (params && params.length > 0) {
                        params.forEach(function (_, i) {
                            sqliteSql_1 = sqliteSql_1.replace("$".concat(i + 1), '?');
                        });
                    }
                    stmt = sqliteDb.prepare(sqliteSql_1);
                    rows = params ? stmt.all.apply(stmt, params) : stmt.all();
                    return [2 /*return*/, { rows: rows }];
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Query failed. DB Type: ".concat(dbType, ", SQL: ").concat(sql.substring(0, 100)), error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Get single row
function queryOne(sql, params) {
    return __awaiter(this, void 0, void 0, function () {
        var result, sqliteSql_2, stmt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(dbType === 'postgresql')) return [3 /*break*/, 2];
                    if (!postgresClient)
                        throw new Error('PostgreSQL client not initialized');
                    return [4 /*yield*/, postgresClient.query(sql, params)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows[0]];
                case 2:
                    if (!sqliteDb)
                        throw new Error('SQLite database not initialized');
                    sqliteSql_2 = sql;
                    if (params && params.length > 0) {
                        params.forEach(function (_, i) {
                            sqliteSql_2 = sqliteSql_2.replace("$".concat(i + 1), '?');
                        });
                    }
                    stmt = sqliteDb.prepare(sqliteSql_2);
                    return [2 /*return*/, params ? stmt.get.apply(stmt, params) : stmt.get()];
            }
        });
    });
}
// Execute INSERT/UPDATE/DELETE
function execute(sql, params) {
    return __awaiter(this, void 0, void 0, function () {
        var result, sqliteSql_3, stmt, info;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(dbType === 'postgresql')) return [3 /*break*/, 2];
                    if (!postgresClient)
                        throw new Error('PostgreSQL client not initialized');
                    return [4 /*yield*/, postgresClient.query(sql, params)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, { changes: result.rowCount || 0 }];
                case 2:
                    if (!sqliteDb)
                        throw new Error('SQLite database not initialized');
                    sqliteSql_3 = sql;
                    if (params && params.length > 0) {
                        params.forEach(function (_, i) {
                            sqliteSql_3 = sqliteSql_3.replace("$".concat(i + 1), '?');
                        });
                    }
                    stmt = sqliteDb.prepare(sqliteSql_3);
                    info = params ? stmt.run.apply(stmt, params) : stmt.run();
                    return [2 /*return*/, { changes: info.changes }];
            }
        });
    });
}
function closeConnection() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!postgresClient) return [3 /*break*/, 2];
                    return [4 /*yield*/, postgresClient.end()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (sqliteDb) {
                        sqliteDb.close();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function getDbType() {
    return dbType;
}

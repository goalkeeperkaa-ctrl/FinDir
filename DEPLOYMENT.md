# FinDir Deployment Guide

## Locаль разработки

### Требования
- Node.js 18+
- npm или yarn

### Установка и запуск

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local

# 3. Add Gemini API key (optional, для AI функций)
# Получить ключ: https://ai.google.dev
# Отредактировать: .env.local

# 4. Run dev server
npm run dev

# Сервер запустится на http://localhost:3000
```

### Тестирование

```bash
# TypeScript check
npm run lint

# Production build
npm run build

# Preview build locally
npm run preview
```

---

## Deployment на Vercel

### Шаг 1: Подготовка к миграции БД

Locально SQLite тестируется, но на Vercel нужна persistent БД. Варианты:

**Вариант A: PostgreSQL (рекомендуется)**
- Создать БД на: Railway, Supabase, или Neon
- Добавить DATABASE_URL в Vercel environment variables

**Вариант B: MongoDB** (если нужна NoSQL)
- Создать на MongoDB Atlas
- Подключить через Mongoose или native driver

**Вариант C: Vercel Storage** (пока в бета)
- Использовать встроенное хранилище Vercel

### Шаг 2: Миграция на Vercel

```bash
# 1. Создать Vercel project
vercel login
vercel link

# 2. Добавить env variables в Vercel
# Settings → Environment Variables
# - GEMINI_API_KEY
# - DATABASE_URL (если не SQLite)
# - NODE_ENV=production

# 3. Деплой
vercel deploy --prod
```

### Шаг 3: Настройка PostgreSQL (если выбран)

#### Использование Supabase (легче всего):

```bash
# 1. Создать Supabase project: https://supabase.com
# 2. Получить DATABASE_URL
# 3. Мигрировать схему:

npm install pg
npx pg-migrate create --postgres-url "postgresql://..." <<EOF
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
EOF

# 4. Seed начальные категории (в server.ts нужно обновить подключение)
```

---

## Текущие API endpoints

### Транзакции
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add transaction
- `POST /api/import` - Bulk import from CSV

### Категории
- `GET /api/categories` - Get all categories

### Статистика & Отчеты
- `GET /api/stats` - Dashboard stats
- `GET /api/reports/p-l` - Profit & Loss
- `GET /api/reports/cash-flow` - Cash flow by month

### AI Features
- `POST /api/categorize` - AI auto-categorize (requires GEMINI_API_KEY)
- `POST /api/chat` - AI chat with AFM assistant (requires GEMINI_API_KEY)

---

## TODO для production-readiness

- [ ] Перенести на PostgreSQL (из SQLite)
- [ ] Добавить authentication & authorization
- [ ] Реализовать rate limiting на API
- [ ] Добавить логирование и мониторинг
- [ ] Валидацию данных на всех endpoints
- [ ] Error handling и retry logic
- [ ] Кеширование часто запрашиваемых данных
- [ ] Документация API (Swagger/OpenAPI)
- [ ] Unit & E2E тесты
- [ ] Backup & restore策略

---

## Environment Variables Reference

```
GEMINI_API_KEY        - Google Gemini API key (опционально)
DATABASE_URL          - PostgreSQL connection string (для production)
PORT                  - Server port (default: 3000)
NODE_ENV              - development | production
```

---

## Troubleshooting

### SQLite on Vercel не сохраняет данные
- **Проблема**: /data/finance.db теряется при перезагрузке Vercel
- **Решение**: Мигрировать на PostgreSQL или MongoDB

### Gemini API не работает
- **Проблема**: "Gemini API Key not configured"
- **Решение**: Добавить GEMINI_API_KEY в .env.local и Vercel

### Порт 3000 занят локально
- **Решение**: `PORT=3001 npm run dev`

---

## Дополнительные ресурсы

- [Vercel Deploy Guide](https://vercel.com/docs/deployments/overview)
- [Supabase Setup](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev)
- [Express.js Docs](https://expressjs.com)

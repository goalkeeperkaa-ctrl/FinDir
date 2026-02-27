# FinDir Deployment Guide

## Локаль разработки

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

# 4. Run dev server (uses SQLite by default)
npm run dev

# Сервер запустится на http://localhost:3000
```

### Использование PostgreSQL локально (опционально)

```bash
# Если хотите тестировать PostgreSQL локально:
DATABASE_URL="postgresql://user:password@host:5432/dbname" npm run dev

# Приложение автоматически переключится на PostgreSQL
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

### Шаг 1: Создание PostgreSQL БД (Supabase рекомендуется)

```bash
# 1. Перейти на https://supabase.com
# 2. Создать новый проект (выбрать ближайший регион)
# 3. Дождаться инициализации (2-3 минуты)
# 4. Settings → Database → Connection string
# 5. Скопировать полную URL (включает пароль)
# 6. Сохранить где-то безопасно
```

**Альтернативы**: Railway, Neon, или другие PostgreSQL хостинги

### Шаг 2: Деплой на Vercel

```bash
# 1. Убедиться что всё закомичено:
git add .
git commit -m "Add PostgreSQL support"
git push origin main

# 2. Перейти на https://vercel.com/dashboard
# 3. Settings → Environment Variables для FinDir проекта
# 4. Добавить переменные:
#    - DATABASE_URL: (postgresql:// URL из Supabase)
#    - GEMINI_API_KEY: (опционально, для AI)
#    - NODE_ENV: production

# 5. Деплой выполнится автоматически или:
vercel deploy --prod
```

**Результат**: Приложение переключится на PostgreSQL автоматически!

### Шаг 3: Готовая PostgreSQL поддержка

**Хорошая новость**: Приложение уже полностью поддерживает PostgreSQL!

Когда вы установите `DATABASE_URL` в Vercel:
- ✅ Приложение автоматически переключится на PostgreSQL
- ✅ Таблицы будут созданы автоматически
- ✅ Категории будут инициализированы автоматически
- ✅ Все API endpoints будут работать как с SQLite, так и с PostgreSQL

**Файлы для PostgreSQL поддержки:**
- `server/db-manager.ts` - Абстракция БД (работает с обоими)
- `server/db-postgres.ts` - PostgreSQL инициализация
- `server.ts` - Все endpoints обновлены на async/await

Просто добавьте `DATABASE_URL` в Vercel и деплойте! 🚀

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

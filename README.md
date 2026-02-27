# FinDir - Intelligent Financial Management Platform

**Nexus 3.0**: SaaS платформа для автоматизированного сбора, анализа и управления финансовыми данными компании.

## Features

### ✅ MVP Phase (Реализовано)
- 📊 **Dashboard** - KPI карточки, cash flow визуализация, бюджет-трекинг
- 💼 **Transaction Management** - Добавление, фильтрация, статус операций
- 📈 **Reports** - P&L (Profit & Loss) и Cash Flow анализ по месяцам
- 📥 **Data Import** - Массовая загрузка транзакций из CSV/Excel
- 🤖 **AI Assistant** - AFM чат для анализа финансов (Google Gemini)
- 🔄 **Auto-Categorization** - Умная автоматическая категоризация платежей
- 🎯 **Scenarios** - Симулятор "что если" для планирования расходов

### 🚧 Phase 2 (На roadmap)
- 🏦 Bank API integrации (для автоматической загрузки выписок)
- 🔍 Anomaly Detection (выявление аномалий и дублей)
- 📊 Advanced Reports (управленческий баланс, юнит-экономика)
- 📱 Mobile App / Telegram Bot
- 🔐 User Authentication & Multi-tenant

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Recharts, Motion |
| **Backend** | Express.js, Node.js |
| **Database** | SQLite (dev), PostgreSQL (prod) |
| **AI** | Google Gemini API |
| **Deployment** | Vercel |

## Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn

### Installation

```bash
# 1. Clone and install
git clone https://github.com/goalkeeperkaa-ctrl/FinDir.git
cd FinDir
npm install

# 2. Setup environment (optional, for AI features)
cp .env.example .env.local
# Add GEMINI_API_KEY from https://ai.google.dev

# 3. Run dev server
npm run dev

# Server runs on http://localhost:3000
```

### Build & Deploy

```bash
npm run build        # Production build
npm run preview      # Preview build locally

# Deploy to Vercel
vercel deploy --prod
```

## API Endpoints

### Transactions & Stats
```
GET    /api/transactions        - List all transactions
POST   /api/transactions        - Create transaction
GET    /api/categories          - Get categories
GET    /api/stats               - Dashboard statistics
```

### Reports
```
GET    /api/reports/p-l         - Profit & Loss report
GET    /api/reports/cash-flow   - Cash flow analysis
```

### Data Import
```
POST   /api/import              - Bulk import from CSV
```

### AI Features (requires GEMINI_API_KEY)
```
POST   /api/categorize          - Auto-categorize transaction
POST   /api/chat                - Chat with AFM assistant
```

## Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core Dashboard | ✅ Complete | KPI, charts, budget tracking |
| Transactions CRUD | ✅ Complete | Full CRUD + filtering |
| P&L & Cash Flow | ✅ Complete | Monthly aggregation, trends |
| CSV Import | ✅ Complete | Papa Parse integration |
| AI Categorization | ⚠️ Configured | Requires API key |
| Auth | ❌ Not yet | Needed for multi-user |
| Bank API | ❌ Roadmap | H1 2026 |
| Mobile | ❌ Roadmap | Telegram bot first |

## Database Schema

```sql
-- Categories: Income/Expense types
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT CHECK(type IN ('income', 'expense'))
);

-- Transactions: Financial records
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  date TEXT,
  amount REAL,
  description TEXT,
  category_id TEXT,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

## Environment Variables

```
GEMINI_API_KEY      - Google Gemini API key (optional, for AI)
PORT               - Server port (default: 3000)
NODE_ENV           - development | production
DATABASE_URL       - PostgreSQL URL (production only)
```

## Development

```bash
npm run lint        # TypeScript check
npm run dev         # Dev server with HMR
npm run build       # Production build
npm run preview     # Preview production build
npm run clean       # Clean dist folder
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick deploy to Vercel:**
```bash
vercel login
vercel deploy --prod
```

## Troubleshooting

**Port already in use?**
```bash
PORT=3001 npm run dev
```

**Need Gemini API key?**
Get it free: https://ai.google.dev

**TypeScript errors?**
```bash
npm run lint
```

## License

MIT

## Support

📧 Email: support@findir.app
🐛 Issues: https://github.com/goalkeeperkaa-ctrl/FinDir/issues

---

**Status**: MVP Phase ✨ | **Last Updated**: Feb 2026 | **Team**: FinDir Dev

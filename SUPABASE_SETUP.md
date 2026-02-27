# Supabase Setup Guide for FinDir

## 5-Minute PostgreSQL Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "Sign Up" → Create account (or login)
3. Click "New Project"
4. Fill in:
   - **Project name**: `findir-prod` (or any name)
   - **Password**: Save it! (you won't need it though)
   - **Region**: Choose closest to you (Europe, US, Asia)
5. Wait 2-3 minutes for initialization ⏳

### 2. Get Database URL

1. Once project is created, go to **Settings** → **Database**
2. Look for "Connection string" section
3. Copy the `postgresql://` URL (you'll see the full URL with password)
4. **Important**: Change `[YOUR-PASSWORD]` to actual password you set in step 4 above

### 3. Add to Vercel Environment

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your **FinDir** project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the PostgreSQL URL from Supabase
5. Click "Save"

### 4. Deploy to Vercel

```bash
# Install pg dependency
npm install

# Build locally to test (optional)
npm run build

# Deploy to Vercel
vercel deploy --prod
```

That's it! Your app now uses PostgreSQL on Vercel. 🎉

---

## Database Details (FYI)

**Supabase is:**
- ✅ PostgreSQL hosted in the cloud
- ✅ Free tier: 2 projects, 500MB storage
- ✅ Easy backups & point-in-time recovery
- ✅ Includes auth, real-time, storage

**Our tables:**
- `categories`: 6 predefined (Выручка, ФОТ, ПО, Маркетинг, Аренда, Налоги)
- `transactions`: Your financial data

**Auto-initialized on first deploy:**
- Tables created automatically
- Seed data loaded
- Ready to use

---

## Troubleshooting

**Q: "DATABASE_URL is not set" error?**
A: Make sure you added DATABASE_URL to Vercel Environment Variables, then redeploy with `vercel deploy --prod`

**Q: "Connection refused" on local?**
A: Use SQLite locally. PostgreSQL URL only needed for Vercel production.

**Q: Lost data after deploy?**
A: If you used SQLite before, data was local. PostgreSQL is persistent. Use Supabase for long-term storage.

**Q: Need to migrate old SQLite data?**
A: We can do this if needed. SQLite → PostgreSQL migration script available on request.

---

## Testing PostgreSQL Connection Locally

**Option 1: Test with Supabase URL (Advanced)**

```bash
# Get your DATABASE_URL from Supabase Settings → Database → Connection string
# Set it as environment variable and run:

DATABASE_URL="postgresql://user:password@host:5432/postgres" npm run dev

# All endpoints will use PostgreSQL instead of SQLite
# Test at http://localhost:3000/api/categories
```

**Option 2: Continue with SQLite for local testing**

```bash
# Leave DATABASE_URL unset and SQLite will be used:
npm run dev

# When you deploy to Vercel, set DATABASE_URL there and PostgreSQL will be used.
```

---

## Next Steps

1. ✅ Update server.ts to support both SQLite and PostgreSQL
2. ✅ Test local development with SQLite
3. Create PostgreSQL database on Supabase
4. Add DATABASE_URL to Vercel environment variables
5. Deploy to Vercel with PostgreSQL
6. Test all endpoints on production
7. Add new features (anomaly detection, unit economics, etc.)
8. Optional: Add user authentication

See DEPLOYMENT.md for full deployment guide.

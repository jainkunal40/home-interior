# SiteBooks / Explore Interiors — Agent Notes

This file is the operational handoff for future agent sessions. Read it before touching the database.

## Project

- **App:** SiteBooks / Explore Interiors — project-finance tracker for interior design and construction.
- **Stack:** Next.js App Router, TypeScript, Prisma 5, PostgreSQL on Neon, NextAuth v5, Tailwind.
- **Workspace:** `/Users/kunaljain/sitebooks`
- **Database:** Neon `neondb`
  - Project: `round-scene-72670883`
  - Branch: `br-super-bonus-amifwhwp`
  - Endpoint: `ep-dry-morning-amg1na4e`
  - Region: `us-east-1`
  - Connection string lives in `.env` as `DATABASE_URL` and is gitignored.

## Hard safety rules

1. **Never run `source .env`.** `.env` is dotenv syntax, not a shell script. Read individual values with `grep`/Python instead. Sourcing it has already caused data loss once (see incident log).
2. **Never run `npm run db:seed` against the Neon database.** `prisma/seed.ts` deletes every row in `User`, `Client`, `Project`, `ExpenseTransaction`, `IncomeTransaction`, `LaborEntry`, `Milestone`, `Note`, `Attachment`, `ActivityLog`, `Vendor`, and `Contractor`, then recreates demo data.
3. **`npm run db:push` targets the remote Neon database.** Do not run it without explicit approval. Use a Neon branch or a separate local database for schema experiments.
4. **Before any destructive DB operation,** create a Neon branch/snapshot and state exactly what will be deleted.
5. **Never print or commit secrets.** Do not echo `DATABASE_URL` with its password. Use host/db/user only in diagnostics.
6. **Do not run migrations or bulk updates without a verified backup/restore point.**

## Incident log

### 2026-11-05 — accidental seed wiped live data

- `.env` had a malformed line that combined `AUTH_URL`, `DATABASE_URL`, and `npx tsx prisma/seed.ts` on one line.
- An agent ran `source .env` while checking the DB. The embedded seed command executed.
- `prisma/seed.ts` deleted all application rows and recreated the demo dataset.
- Recovery: Neon point-in-time restore to before `2026-11-05 14:57 UTC`. The same branch and endpoint were restored successfully.
- Prevention: `.env` was split into valid lines, the embedded command removed, an explicit `AUTH_SECRET` added, and this warning file created.

## Verified database state after restore

Snapshot from **2026-11-05** (counts will change as the app is used):

- 3 users, 6 projects, 5 clients
- 64 `ExpenseTransaction` rows
- 44 `MaterialEntry` rows
- 53 `MaterialPayment` rows
- All 44 material entries have `paidByClient = true`

## Materials model

- Material-category spend lives in `MaterialEntry` + `MaterialPayment`, not ordinary `ExpenseTransaction` rows.
- Material categories: `materials`, `hardware`, `furnishing`.
- Material payments are surfaced in the Expenses tab for visibility but are managed through the Materials tab.
- Material costs marked `paidByClient` are excluded from owner P&L, but included in budget utilization.
- Recent behavior: the Expenses form can still create/link material entries, and material payment rows in Expenses are editable — this is ahead of the older handoff text that called them read-only.

## Local development

```bash
cd /Users/kunaljain/sitebooks
npm install        # already installed in this workspace
npm run dev        # http://localhost:3000
npm run build
npm run start
npm run db:studio  # Prisma Studio against DATABASE_URL
```

- `AUTH_URL` / `NEXTAUTH_URL` should be `http://localhost:3000` for local dev.
- File uploads fall back to `public/uploads` when `BLOB_READ_WRITE_TOKEN` is unset.
- Telegram/WhatsApp notifications no-op without their tokens.
- Do not use `prisma/dev.db`; the schema is PostgreSQL.

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

- 3 users, 6 projects, 6 clients
- 59 `ExpenseTransaction` rows
- 47 `MaterialEntry` rows
- 57 `MaterialPayment` rows
- All 47 material entries have `paidByClient = true`

### Data fixes applied 2026-11-05

Read-only audit followed by targeted fixes (backup: `.db-backups/pre-fix-baseline-20261105-225555.sql`, gitignored):

- Created the missing `Client` "Raskar pariwar" and linked project `cmqtto5oq0001ws20ktxeoubm` to it; budget `0` → `7,50,000`.
- Trimmed trailing spaces from 149 name/title/description values across 10 columns (all pre-existing rows had a trailing `0x20`). Root cause: no `.trim()` in the zod schemas — now added to `src/lib/validations.ts`, `vendors.ts`, `contractors.ts`, `materials.ts`, `expenses.ts`, `settings.ts`.
- Labor entry `cmooh3w8g0002wnn5zlezzy9q` (Jain Pariwar AC work): `totalAmount` `28,200` → `31,400` so it matches the two linked expenses (₹28,200 + ₹3,200) and no longer reads as overpaid.
- Labor entry `cmuat778k0002kyguk45kkkgh`: reversed start/end dates swapped to `2026-09-15` → `2026-09-21`.
- Added a ₹19 `MaterialPayment` to settle material entry `cmo9yjttp001hj8k2522qybzz` ("Dhanesh") in full.
- Backfilled `vendorName` on 5 `MaterialEntry` rows from their `Vendor` relation.
- Deleted the two rejected ₹1 "test" expenses in Jain Pariwar.
- Migrated the last 3 legacy material-category expenses into `MaterialEntry` + `MaterialPayment` (project spend verified unchanged). No material-category `ExpenseTransaction` rows remain.
- Repointed 20 `ActivityLog` rows (15 income, 5 labor) whose `entityId` held a project id — it now references the real transaction id.

Known-acceptable state (verified, not bugs): 3 material entries remain partially paid (genuine payables in Jain Pariwar), and 3 labor entries carry manual advances with no linked expenses — those advances are now preserved by `adjustLaborPaid`.

23 `ActivityLog` rows still reference entities that were deleted before this cleanup (15 expense, 5 material, 1 income, 1 labor, 1 milestone). They cannot be repaired by inference and are harmless: `getActivityLogs` filters on `projectId`, never `entityId`.

### Labor paid accounting

`src/actions/expenses.ts` must **never** recompute `advancePaid` from linked expenses. It uses `adjustLaborPaid(laborEntryId, delta)`, which applies only the changed expense's contribution. Overwriting the field loses advances the owner entered by hand (entries with no linked expense rows).


## Materials model

- Material-category spend lives in `MaterialEntry` + `MaterialPayment`, not ordinary `ExpenseTransaction` rows.
- Material categories: `materials`, `hardware`, `furnishing`.
- Material payments are surfaced in the Expenses tab for visibility but are read-only there; they are managed through the Materials tab.
- Owner-created expenses cannot use material categories — `createExpense` / `updateExpense` reject them server-side, and the owner expense form omits them.
- Client-submitted material-category expenses are still accepted; once approved they appear in the Materials tab as one-off expense rows.
- Material costs marked `paidByClient` are excluded from owner P&L, but included in budget utilization.
- Financial rules are centralized in `src/lib/finance.ts` and covered by `src/lib/finance.test.ts` (`npm test`).

## Financial calculations

- Single source of truth: `src/lib/finance.ts`.
- Pending/rejected expenses are excluded from all totals.
- Expenses linked to a labor entry are excluded from expense totals (the labor entry carries the cost).
- Material payments count as spend; unpaid bill balances are payables.
- Owner P&L = income − owner expenses − owner material payments − owner labor.
- Client total paid = income + client-paid expenses + client-paid material payments + client labor advances.
- Payables shown to the owner exclude client-paid material and labor balances.

## Local development

```bash
cd /Users/kunaljain/sitebooks
npm install        # already installed in this workspace
npm run dev        # http://localhost:3000
npm run build
npm run start
npm test           # finance calculation tests
npm run db:studio  # Prisma Studio against DATABASE_URL
```

- `AUTH_URL` / `NEXTAUTH_URL` should be `http://localhost:3000` for local dev.
- File uploads fall back to `public/uploads` when `BLOB_READ_WRITE_TOKEN` is unset.
- Telegram/WhatsApp notifications no-op without their tokens.
- Do not use `prisma/dev.db`; the schema is PostgreSQL.

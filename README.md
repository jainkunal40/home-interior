# Explore Interiors — Project Finance Tracker for Interior & Construction

> A full-stack web application for **Explore Interiors** to manage project finances, client payments, labor, vendors, contractors, milestones, and documents — with a dedicated **client portal** for transparent billing.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Notifications Setup](#notifications-setup)
- [Deployment (Vercel)](#deployment-vercel)
- [Key Workflows](#key-workflows)
- [Data Model](#data-model)

---

## Overview

Explore Interiors is a private business management tool built for interior design and construction firms. It tracks the complete financial lifecycle of each project — from initial budget to final profit — while giving clients a secure portal to view progress, make payments, and submit expenses for approval.

**Live URL:** https://home-interior-gules.vercel.app

---

## Features

### Owner / Dashboard
- **Dashboard** — project list only: each card shows budget, income, total spent, profit, % of budget used, milestones, and pending approvals
- **Project Management** — create projects with budget, start/end dates, site address, and client assignment
- **Income Tracking** — record payments received, broken down by payment type and source
- **Expense Tracking** — log non-material costs (transport, subcontractor, labor, site expense, rental, utility, misc) with GST/tax support
- **Materials** — record material/hardware/furnishing bills, add payments against them, and track paid vs. pending balances
- **Labor Tracking** — track workers, trade types, daily/hourly rates, advance payments, and contractor assignments
- **Forecast** — current spend, likely final cost, budget variance, and editable per-category budgets
- **Payables** — owner-borne material and labor dues in one list
- **Ledger** — vendor and contractor billed/paid statements
- **Milestones** — define project milestones with due dates and completion status
- **Phases** — break projects into phases (planning, in-progress, completed) with sort order
- **Attachments** — upload and manage project files and photos (Vercel Blob storage)
- **Notes** — internal project notes
- **Reports** — P&L summary, category expense breakdown, monthly trends, client vs. owner cost split, CSV export
- **Activity** — audit trail of project changes, approvals, and payments
- **Vendors** — global vendor directory with category, GST number, and contact details
- **Contractors** — global contractor directory with trade specialization
- **Settings** — profile management, password change, notification channel configuration, client portal password reset

### Client Portal
- Separate authenticated portal for project clients
- View project status, budget, total paid, remaining balance, timeline, photos, and milestones
- Full payment history (income payments + client-paid expenses and materials)
- Submit expenses for owner approval (with vendor/contractor selection from assigned list)
- Record payments made to the owner
- Track submitted expense approval status (pending / approved / rejected)
- Change portal password
- Clients cannot edit or delete owner records

### Financial Calculations
Shared rules live in `src/lib/finance.ts`; every screen, the statement PDF, and the Telegram bot use them.

- **Counted expenses** — `pending` and `rejected` expenses are excluded from every total
- **No double counting** — expenses linked to a labor entry are excluded from expense totals
- **Materials** — material payments count as spend; unpaid bill balances are payables, not spend
- **Budget Utilization** — all counted spend + all material payments + all labor (owner + client-paid)
- **Net Profit / P&L** — income minus owner-borne expenses, owner material payments, and owner labor only
- **Client-Paid Total** — cash the client has actually paid: income + client-paid expenses + client-paid material payments + client labor advances
- **Client-Borne Cost** — full value the client is responsible for, including the full value of client-paid labor entries
- **Payables** — only owner-borne material and labor dues

### Notifications
- **WhatsApp** (Meta Cloud API) — for businesses with WhatsApp Business accounts
- **Telegram** (Bot API, free, no limits) — preferred for low-cost setup
- Per-user and per-client notification channel selection (`none` / `whatsapp` / `telegram`)
- **Auto-connect flow** — Telegram deep links auto-register client/owner chat IDs
- Notification events:
  - Client submits expense → owner notified
  - Owner approves/rejects expense → client notified
  - Payment (income) recorded → client notified
  - Milestone marked complete → client notified

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma 5 |
| Auth | NextAuth v5 (credentials provider) |
| Styling | Tailwind CSS v4 |
| UI Icons | Lucide React |
| Charts | Recharts |
| File Storage | Vercel Blob |
| Validation | Zod |
| Notifications | WhatsApp Cloud API + Telegram Bot API |
| Deployment | Vercel |
| Runtime | Node.js / React 19 |

---

## Project Structure

```
src/
├── actions/          # Server Actions (mutations & queries)
│   ├── auth.ts       # Login, signup
│   ├── projects.ts   # Project CRUD + activity log
│   ├── expenses.ts   # Expense CRUD + client submit/approve/reject
│   ├── materials.ts  # Material entries + material payments
│   ├── income.ts     # Income CRUD + client payment submission
│   ├── labor.ts      # Labor entry CRUD
│   ├── milestones.ts # Milestone CRUD
│   ├── vendors.ts    # Vendor CRUD + project assignment
│   ├── contractors.ts# Contractor CRUD + project assignment
│   └── settings.ts   # Profile, password, notifications
│
├── app/
│   ├── (dashboard)/  # Owner dashboard (protected)
│   │   ├── dashboard/
│   │   ├── projects/[id]/
│   │   ├── vendors/
│   │   ├── contractors/
│   │   └── settings/
│   ├── (client)/     # Client portal (separate auth)
│   │   └── portal/[id]/
│   ├── api/
│   │   ├── upload/   # File upload to Vercel Blob
│   │   ├── download/ # File download
│   │   ├── export/   # Project CSV export
│   │   ├── statement/# Client statement PDF
│   │   ├── cron/     # Scheduled reminders
│   │   ├── telegram/webhook/
│   │   └── whatsapp/webhook/
│   ├── login/
│   └── signup/
│
├── components/
│   ├── projects/
│   │   ├── project-detail-view.tsx   # Tab-based project detail
│   │   └── tabs/                     # 13 tabs: overview, income, expenses, labor, materials,
│   │                                 # forecast, payables, ledger, milestones, files, notes,
│   │                                 # reports, activity
│   └── ui/           # Design system (Button, Card, Input, Select, Modal, Badge, etc.)
│
├── lib/
│   ├── auth.ts       # NextAuth config
│   ├── prisma.ts     # Prisma client singleton
│   ├── session.ts    # requireAuth helper
│   ├── currency.ts   # formatINR, formatINRCompact
│   ├── finance.ts    # Shared financial rules (single source of truth)
│   ├── finance.test.ts # Tests for the financial rules
│   ├── utils.ts      # cn(), status helpers, label lookups
│   ├── validations.ts# Zod schemas
│   ├── bot-commands.ts # Telegram/WhatsApp owner commands
│   ├── notifications.ts  # Unified notification dispatcher
│   ├── whatsapp.ts   # WhatsApp Cloud API provider
│   └── telegram.ts   # Telegram Bot API provider
│
└── instrumentation.ts # Auto-registers Telegram webhook on server start

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # ⚠️ Destructive demo seed — never run against live data
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- A Vercel account (for deployment + Blob storage)

### Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd Explore Interiors

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Fill in all required values in .env

# 4. Push database schema
npm run db:push

# 5. Seed a fresh demo database (DESTRUCTIVE — deletes all app data first)
#    Only run this on a local/dev database, never on Neon production.
npm run db:seed

# 6. Start the dev server
npm run dev

# 7. Run the finance tests
npm test
```

The app will be available at http://localhost:3000.

Default admin credentials after seeding are printed to the terminal by `seed.ts`.

> **Data safety:** `prisma/seed.ts` deletes every application row before recreating demo data. See [`AGENTS.md`](./AGENTS.md) before pointing any command at the live Neon database.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | NextAuth secret — generate with `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | Full base URL of the app (e.g. `https://your-app.vercel.app`) |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob token — auto-set from Vercel dashboard |
| `WHATSAPP_ACCESS_TOKEN` | optional | Meta WhatsApp Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | optional | Meta WhatsApp phone number ID |
| `TELEGRAM_BOT_TOKEN` | optional | Telegram bot token from @BotFather |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | optional | Bot username (without @) for deep links |

---

## Database Setup

The schema uses PostgreSQL with Prisma ORM.

```bash
# Apply schema changes to database (targets DATABASE_URL — get approval first)
npm run db:push

# Open Prisma Studio (visual DB browser)
npm run db:studio

# Seed demo data (DESTRUCTIVE — deletes all application rows first)
npm run db:seed

# Run the finance calculation tests
npm test
```

> `db:push` and `db:seed` operate on whatever `DATABASE_URL` points to. For the live Neon database, create a branch/snapshot and get explicit approval before either command.

### Key Models

| Model | Description |
|---|---|
| `User` | Owner/admin account with notification preferences |
| `Client` | Project client with portal access and notification preferences |
| `Project` | Core entity — links user, client, and all financial data |
| `ExpenseTransaction` | Non-material expense with category, vendor, tax, paidByClient flag, approvalStatus |
| `MaterialEntry` | Material/hardware/furnishing bill with vendor, bill amount, and paidByClient flag |
| `MaterialPayment` | Payment made against a material entry |
| `LaborEntry` | Labor cost with contractor, rate, advance paid tracking |
| `IncomeTransaction` | Payment received from client |
| `Milestone` | Project milestone with due date and completion status |
| `ProjectPhase` | Ordered phase within a project |
| `Vendor` | Material/service supplier (global, reusable across projects) |
| `Contractor` | Labor contractor by trade (global, reusable across projects) |
| `Attachment` | File uploaded to Vercel Blob, linked to project or expense |
| `Note` | Internal project note |
| `ActivityLog` | Audit trail of project changes and approvals |

---

## Notifications Setup

### Telegram (Recommended — Free)

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Copy the bot token into `TELEGRAM_BOT_TOKEN`
3. Set `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` to your bot's username (without @)
4. Deploy the app — the webhook is auto-registered on server start via `instrumentation.ts`
5. Owner: go to **Settings → Connect Telegram** and click the deep link
6. Client: the **Overview** tab in their project shows a **Connect Telegram** card with a deep link
7. Once connected, the bot auto-captures the chat ID and updates the database

### WhatsApp (Meta Cloud API)

1. Set up a Meta Business account and create a WhatsApp Business app
2. Copy the access token and phone number ID into `.env`
3. Set `notificationChannel` to `whatsapp` in Settings

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Required Vercel settings:**
- Add all environment variables from `.env` in the Vercel project settings
- Add **Vercel Blob** storage from the Storage tab — this auto-sets `BLOB_READ_WRITE_TOKEN`
- Set `AUTH_URL` to your production domain

**Build command:** `next build`  
**Install command:** `npm install` (runs `prisma generate` via postinstall)

---

## Key Workflows

### Adding a Project
1. Dashboard → **New Project**
2. Fill in name, client, budget, site address, dates
3. Assign vendors and contractors from the global directory
4. Set milestones with due dates

### Client Portal Access
1. Create a client in **Settings → Clients** or when creating a project
2. Set a portal password via **Settings → Reset Client Password**
3. Share the portal URL: `https://your-app.vercel.app/portal`
4. Client logs in with their email and portal password

### Materials
1. Open a project → **Materials** tab → **Add Material Entry**
2. Enter the description, category, bill amount, vendor, and bill date
3. Record payments against the bill with **Record Payment**
4. The tab shows total bills, paid, pending, and one-off material-category expenses
5. Material payments also appear read-only in the **Expenses** tab with a **Manage in Materials** link

### Expense Approval Flow
1. Client submits an expense via **Add Expense** in their portal
2. Owner receives a notification (WhatsApp or Telegram)
3. Owner reviews it in the project's **Expenses** tab → approves or rejects
4. Client receives a notification of the decision
5. Approved expenses are included in financial calculations
6. Approved material-category submissions appear in the **Materials** tab as one-off expenses

> Owner-created expenses cannot use the material categories (`materials`, `hardware`, `furnishing`). Those are managed in the Materials tab.

### Client Portal Writes
Clients can:
- Submit expenses for approval (pending until the owner approves)
- Record payments made to the owner
- Change their portal password

Clients cannot edit or delete owner-entered records.

### Client-Paid vs. Owner-Paid
- Expenses, material entries, and labor entries can be flagged as **Paid by Client**
- These are excluded from the owner's P&L (net profit) but included in budget utilization
- **Payables** and forecast dues show only owner-borne balances
- The client portal shows cash the client has actually paid: income, client-paid expenses, client-paid material payments, and client labor advances

---

*Built for Explore Interiors · Internal use only*

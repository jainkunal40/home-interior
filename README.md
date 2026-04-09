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
- **Dashboard** — summary of income, expenses, labor cost, and net profit across all projects; over-budget alerts; milestones due this week
- **Project Management** — create projects with budget, start/end dates, site address, and client assignment
- **Income Tracking** — record payments received, broken down by payment type and source
- **Expense Tracking** — log materials, hardware, furnishing, transport, subcontractor, and miscellaneous costs with GST/tax support
- **Labor Tracking** — track workers, trade types, daily/hourly rates, advance payments, and contractor assignments
- **Milestones** — define project milestones with due dates and completion status
- **Phases** — break projects into phases (planning, in-progress, completed) with sort order
- **Attachments** — upload and manage project files and photos (Vercel Blob storage)
- **Notes** — internal project notes
- **Reports** — P&L summary, category expense breakdown, client vs. owner cost split
- **Vendors** — global vendor directory with category, GST number, and contact details
- **Contractors** — global contractor directory with trade specialization
- **Settings** — profile management, password change, notification channel configuration, client portal password reset

### Client Portal
- Separate authenticated portal for project clients
- View project status, budget, total paid, remaining balance, and milestones
- Full payment history (income payments + direct client expenses)
- Submit expenses for owner approval (with vendor/contractor selection from assigned list)
- Track submitted expense approval status (pending / approved / rejected)
- Change portal password

### Financial Calculations
- **Budget Utilization** — includes ALL expenses and labor (owner + client-paid)
- **Net Profit / P&L** — calculated only on owner-borne costs (excludes client-paid items)
- **Client-Paid Total** — client-paid expenses (approved only) + labor advance paid by client
- Pending client expenses are excluded from all calculations until approved

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
│   ├── projects.ts   # Project CRUD
│   ├── expenses.ts   # Expense CRUD + client submit/approve/reject
│   ├── income.ts     # Income CRUD
│   ├── labor.ts      # Labor entry CRUD
│   ├── milestones.ts # Milestone CRUD
│   ├── vendors.ts    # Vendor CRUD
│   ├── contractors.ts# Contractor CRUD
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
│   │   └── telegram/webhook/  # Telegram bot webhook
│   ├── login/
│   └── signup/
│
├── components/
│   ├── projects/
│   │   ├── project-detail-view.tsx   # Tab-based project detail
│   │   └── tabs/                     # overview, income, expenses, labor, milestones, attachments, notes, reports
│   └── ui/           # Design system (Button, Card, Input, Select, Modal, Badge, etc.)
│
├── lib/
│   ├── auth.ts       # NextAuth config
│   ├── prisma.ts     # Prisma client singleton
│   ├── session.ts    # requireAuth helper
│   ├── currency.ts   # formatINR, formatINRCompact
│   ├── utils.ts      # cn(), status helpers, label lookups
│   ├── validations.ts# Zod schemas
│   ├── notifications.ts  # Unified notification dispatcher
│   ├── whatsapp.ts   # WhatsApp Cloud API provider
│   └── telegram.ts   # Telegram Bot API provider
│
└── instrumentation.ts # Auto-registers Telegram webhook on server start

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Seed script (creates admin user)
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

# 5. Seed the database (creates initial admin user)
npm run db:seed

# 6. Start the dev server
npm run dev
```

The app will be available at http://localhost:3000.

Default admin credentials after seeding are printed to the terminal by `seed.ts`.

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
# Apply schema changes to database
npm run db:push

# Open Prisma Studio (visual DB browser)
npm run db:studio

# Seed initial data
npm run db:seed
```

### Key Models

| Model | Description |
|---|---|
| `User` | Owner/admin account with notification preferences |
| `Client` | Project client with portal access and notification preferences |
| `Project` | Core entity — links user, client, and all financial data |
| `ExpenseTransaction` | Expense with category, vendor, tax, paidByClient flag, approvalStatus |
| `LaborEntry` | Labor cost with contractor, rate, advance paid tracking |
| `IncomeTransaction` | Payment received from client |
| `Milestone` | Project milestone with due date and completion status |
| `ProjectPhase` | Ordered phase within a project |
| `Vendor` | Material/service supplier (global, reusable across projects) |
| `Contractor` | Labor contractor by trade (global, reusable across projects) |
| `Attachment` | File uploaded to Vercel Blob, linked to project or expense |
| `Note` | Internal project note |

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

### Expense Approval Flow
1. Client submits an expense via **Add Expense** in their portal
2. Owner receives a notification (WhatsApp or Telegram)
3. Owner reviews it in the project's **Expenses** tab → approves or rejects
4. Client receives a notification of the decision
5. Approved expenses are included in financial calculations

### Client-Paid vs. Owner-Paid
- Expenses and labor entries can be flagged as **Paid by Client**
- These are excluded from the owner's P&L (net profit) but included in budget utilization
- The client portal shows their total contribution across income, direct expenses, and labor advances

---

*Built for Explore Interiors · Internal use only*

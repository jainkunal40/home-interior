# SiteBooks (Explore Interiors) — User Guide

> **Version:** 1.0.0  
> **Last Updated:** April 2026  
> A complete project finance tracker for interior designers and construction professionals.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Creating a New Project](#3-creating-a-new-project)
4. [Project Details & Tabs](#4-project-details--tabs)
   - [Overview](#41-overview-tab)
   - [Income](#42-income-tab)
   - [Expenses](#43-expenses-tab)
   - [Labor & Contractors](#44-labor--contractors-tab)
   - [Milestones](#45-milestones-tab)
   - [Attachments / Files](#46-attachments--files-tab)
   - [Notes](#47-notes-tab)
   - [Reports & Export](#48-reports--export-tab)
5. [Vendors Management](#5-vendors-management)
6. [Contractors Management](#6-contractors-management)
7. [Assigning Vendors & Contractors to Projects](#7-assigning-vendors--contractors-to-projects)
8. [Client Portal](#8-client-portal)
9. [Settings](#9-settings)
10. [FAQs & Tips](#10-faqs--tips)

---

## 1. Getting Started

### Sign Up

1. Open the app and click **"Create an account"** on the login page.
2. Enter your **Full Name**, **Email**, and **Password** (min 6 characters).
3. Click **"Create Account"** — you'll be taken to the Dashboard.

<!-- 📸 SCREENSHOT: Visit /signup — capture the signup form -->

### Login

1. Enter your **Email** and **Password**.
2. Click **"Sign In"** to access the dashboard.

<!-- 📸 SCREENSHOT: Visit /login — capture the login form -->

> **Tip:** Bookmark the app URL for quick access.

---

## 2. Dashboard

The Dashboard is your home screen. It gives you a bird's-eye view of all your projects and finances.

<!-- 📸 SCREENSHOT: Visit /dashboard — capture the full dashboard with summary cards -->

### What you see:

| Section | Description |
|---------|-------------|
| **Header** | Shows the total number of projects and how many are active |
| **Summary Cards** | 4 cards showing: Total Income, Total Expenses, Labor Cost, Net Profit (across all projects) |
| **Over Budget Alerts** | Projects that have exceeded their set budget |
| **Pending Labor Payments** | Contractors who still have outstanding dues |
| **Upcoming Milestones** | Milestones due within the next 7 days |

### Navigation (Sidebar / Bottom Bar)

- **Dashboard** — Home screen (this page)
- **+ New Project** — Create a new project
- **Vendors** — Manage your vendor directory
- **Contractors** — Manage your contractor directory
- **Settings** — Account settings & password change

<!-- 📸 SCREENSHOT: Visit /dashboard — capture the sidebar navigation (desktop) or bottom tabs (mobile) -->

> On **mobile**, navigation appears as a bottom tab bar. On **desktop**, it's a sidebar on the left.

---

## 3. Creating a New Project

1. Click the **"+ New Project"** button on the Dashboard or sidebar.
2. Fill in the project details:

### Project Details

| Field | Required? | Description |
|-------|-----------|-------------|
| Project Name | ✅ Yes | e.g., "3BHK Interior — Green Valley" |
| Description | No | Brief project description |
| Site Address | No | e.g., "A-201, Green Valley, Pune" |
| Status | No | Planning (default), Active, On Hold, Completed, Cancelled |
| Budget (₹) | No | Total estimated budget |
| Start Date | No | When the project begins |
| End Date | No | Expected completion date |

<!-- 📸 SCREENSHOT: Visit /projects/new — capture the project details form -->

### Client Information

| Field | Required? | Description |
|-------|-----------|-------------|
| Client Name | No | e.g., "Mr. Rajesh Patel" |
| Phone | No | Client's phone number |
| Email | No | If provided, a **client portal login** is auto-created |

<!-- 📸 SCREENSHOT: Visit /projects/new — capture the client information section -->

3. Click **"Create Project"**.

### Client Portal Credentials

If you entered a **client email**, a portal login is automatically created. After the project is created, a popup will show:

- **Login Email** — The client's email
- **Password** — An auto-generated password (click 👁 to reveal)
- **Copy Credentials** — Copies both email and password to share with the client

<!-- 📸 SCREENSHOT: Create a project with client email — capture the credentials popup modal -->

> **Important:** Share these credentials with your client so they can log in and view their project's progress, payments, and milestones.

---

## 4. Project Details & Tabs

Click on any project card from the Dashboard to open the project detail view.

The project detail page has **8 tabs** to manage every aspect of your project:

<!-- 📸 SCREENSHOT: Visit /projects/[id] — capture the project header with summary cards and the tab bar -->

### Summary Cards at the Topß

| Card | Description |
|------|-------------|
| **Income** | Total money received for this project |
| **Expenses** | Total material/vendor/site expenses |
| **Labor** | Total contractor and labor costs |
| **Net Profit** | Income − Expenses − Labor |

---

### 4.1 Overview Tab

The Overview tab gives you a complete financial and progress snapshot.

<!-- 📸 SCREENSHOT: Visit /projects/[id] (Overview tab) — capture the budget progress and financial summary -->

#### Sections:

- **Budget vs Actual** — A progress bar showing how much of the budget is used. Color-coded: green (<80%), yellow (80-100%), red (over budget).
- **Financial Summary** — Detailed breakdown of income, expenses, labor, and net profit with profit margin %.
- **Expense Breakdown** — Shows how expenses are distributed across categories (Materials, Transport, etc.).
- **Pending Labor Payments** — Total amount still owed to contractors.
- **Milestones** — Quick view of the first 5 milestones and their statuses.
- **Assigned Vendors** — Vendors linked to this project (see [Section 7](#7-assigning-vendors--contractors-to-projects)).
- **Assigned Contractors** — Contractors linked to this project.
- **Project Info** — Full details with Edit and Delete options.

#### Client Portal Credentials (in Project Info)

If the client has a portal login, you'll see their **login email and password** here with a show/hide toggle and a copy button.

<!-- 📸 SCREENSHOT: Visit /projects/[id] (Overview tab) — scroll to "Project Info" section showing portal credentials -->

#### Editing a Project

1. Click **"Edit"** in the Project Info section.
2. Modify any field — project details, budget, dates, client info.
3. If the client didn't have a portal login before but now has an email, **saving will auto-create a login** and show you the credentials.
4. Click **"Save Changes"**.

<!-- 📸 SCREENSHOT: Open the edit modal on a project — capture the form -->

> **Note:** If you see "⚠️ This client has no portal login yet" in the edit form, saving with the client email will create a login and show you the password.

---

### 4.2 Income Tab

Track all money received for the project — advances, milestone payments, deposits, etc.

<!-- 📸 SCREENSHOT: Visit /projects/[id] → Income tab — capture the income list -->

#### Adding Income

1. Click **"+ Add Income"**.
2. Fill in:

| Field | Required? | Description |
|-------|-----------|-------------|
| Date | ✅ Yes | Payment date (defaults to today) |
| Amount (₹) | ✅ Yes | Amount received |
| Payment Type | ✅ Yes | Advance, Milestone Payment, Deposit, Final Payment, Refund, Other |
| Payment Mode | ✅ Yes | Cash, Bank Transfer, UPI, Cheque, Card, Other |
| Received From | No | Who made the payment |
| Reference No. | No | Transaction or cheque number |
| Project Phase | No | Link to a specific phase |
| Notes | No | Additional details |

3. Click **"Save Income"**.

<!-- 📸 SCREENSHOT: Open the add income modal — capture the form -->

#### Edit / Delete

- Click on any income entry to **edit** it.
- Click the trash icon to **delete** (with confirmation).

---

### 4.3 Expenses Tab

Track every rupee spent — materials, transport, rentals, site expenses, and more.

<!-- 📸 SCREENSHOT: Visit /projects/[id] → Expenses tab — capture the expense list with category filters -->

#### Category Filters

At the top, you'll see category pills showing the expense distribution (e.g., "Materials · 45%"). Click any pill to filter the list by that category.

#### Adding an Expense

1. Click **"+ Add Expense"**.
2. Fill in:

| Field | Required? | Description |
|-------|-----------|-------------|
| Date | ✅ Yes | Expense date |
| Amount (₹) | ✅ Yes | Amount paid |
| Category | ✅ Yes | Materials, Subcontractor, Transport, Labor, Site Expense, Rental, Hardware, Furnishing, Utility, Misc |
| Vendor | No | **Select from dropdown** (all vendors in the system) or type a new name |
| Payment Mode | ✅ Yes | Cash, Bank Transfer, UPI, Cheque, Card, Other |
| Tax/GST (₹) | No | Tax amount separately |
| GST % | No | GST percentage |
| Bill / Invoice No. | No | For record keeping |
| Project Phase | No | Link to a phase |
| Notes | No | Additional details |
| Reimbursable | No | Check if this expense should be reimbursed |

<!-- 📸 SCREENSHOT: Open the add expense modal — capture the form showing vendor dropdown -->

#### Vendor Selection

- For **all categories**, you'll see a dropdown of **all vendors** already added in the Vendors section.
- Select an existing vendor OR type a new vendor name in the text field below.

#### Contractor Selection (for Labor/Subcontractor expenses)

- When the category is **"Labor"** or **"Subcontractor"**, the vendor field changes to show a **contractor dropdown** instead.
- You can also **link the expense to a specific labor entry** to track contractor payments.

<!-- 📸 SCREENSHOT: Open add expense, select "Subcontractor" category — capture showing the contractor dropdown and labor linking -->

---

### 4.4 Labor & Contractors Tab

Track contractor work — daily rates, fixed contracts, per-unit, and per-sqft pricing.

<!-- 📸 SCREENSHOT: Visit /projects/[id] → Labor tab — capture the labor summary and entries -->

#### Summary Stats

Three cards at the top showing: **Total Amount**, **Paid**, and **Pending**.

#### Adding a Labor Entry

1. Click **"+ Add Labor"**.
2. Fill in:

| Field | Required? | Description |
|-------|-----------|-------------|
| Select Existing Contractor | No | **Dropdown of all contractors** in the system — auto-fills name and trade |
| Contractor Name | ✅ Yes | Name (auto-filled if selected above, or type new) |
| Trade | ✅ Yes | Carpenter, Electrician, Plumber, Painter, Civil, Tiles, POP, etc. |
| Rate Type | ✅ Yes | Daily Rate, Fixed Contract, Per Unit, Per Sq Ft, Per Item |
| Rate (₹) | ✅ Yes | Rate amount |
| Qty / Days | ✅ Yes | Number of days/units |
| Initial Advance (₹) | No | Advance paid |
| Start / End Date | No | Work period |
| Status | No | Ongoing, Completed, Pending Payment |
| Project Phase | No | Link to a phase |
| Notes | No | Additional details |

3. Click **"Save Labor"**.

<!-- 📸 SCREENSHOT: Open the add labor modal — capture the form showing the contractor dropdown at the top -->

> **Tip:** When selecting an existing contractor, the name and trade fields auto-fill. If the contractor is new, just type the name — a new contractor record will be created automatically.

#### Payment Tracking

- The **Total** is calculated as: Rate × Quantity (or the fixed rate).
- **Paid** shows the advance + any linked expense payments.
- **Due** = Total − Paid.
- **Payment History** is shown below each entry if expenses are linked to it.

> **Tip:** To record a payment to a contractor, go to the **Expenses tab** → add an expense with category "Labor" or "Subcontractor" → link it to the labor entry.

---

### 4.5 Milestones Tab

Set project milestones and track progress.

<!-- 📸 SCREENSHOT: Visit /projects/[id] → Milestones tab — capture the milestone timeline -->

#### Adding a Milestone

1. Click **"+ Add Milestone"**.
2. Fill in:

| Field | Required? | Description |
|-------|-----------|-------------|
| Title | ✅ Yes | e.g., "Kitchen cabinets installed" |
| Description | No | Details |
| Due Date | No | Target completion date |
| Completion Date | No | When it was actually completed |
| Status | No | Pending, In Progress, Completed, Overdue |
| Phase | No | Link to a project phase |

3. Click **"Save Milestone"**.

#### Progress Tracking

- A **progress bar** at the top shows "X of Y completed".
- Milestones show a **timeline view** with status icons (✓ for completed, ⏰ for pending, ⚠️ for overdue).
- Overdue milestones are highlighted if the due date has passed.

> **Note:** Milestones are also visible to clients in their portal.

---

### 4.6 Attachments / Files Tab

Upload and organize project files — receipts, bills, quotations, photos, etc.

<!-- 📸 SCREENSHOT: Visit /projects/[id] → Files tab — capture the file grid with categories -->

#### Uploading a File

1. Click **"Upload"**.
2. Select a file from your device.
3. Choose a **Category**: Receipt, Bill, Quotation, Invoice, Photo, Document, Other.
4. Click **"Upload"**.

#### Features

- **Image previews** — Thumbnails are shown for image files.
- **Category filters** — Filter files by type (Receipt, Bill, Photo, etc.).
- **Download** — Click the download button on any file.
- **Delete** — Remove files you no longer need.

---

### 4.7 Notes Tab

Quick notes for the project — client preferences, site observations, reminders.

<!-- 📸 SCREENSHOT: Visit /projects/[id] → Notes tab — capture the notes list -->

#### Adding a Note

1. Click **"+ Add Note"**.
2. Type your note in the text area (e.g., "Client wants marble flooring changed to vitrified tiles").
3. Click **"Save"**.

#### Edit / Delete

- Click the **pencil icon** to edit inline.
- Click the **trash icon** to delete.

---

### 4.8 Reports & Export Tab

View detailed financial reports and export data.

<!-- 📸 SCREENSHOT: Visit /projects/[id] → Reports tab — capture the P&L summary -->

#### Report Sections

| Section | What it Shows |
|---------|---------------|
| **P&L Summary** | Income, Expenses (by type), Labor Cost, Net Profit, Profit Margin % |
| **Budget vs Actual** | Budget amount, total cost, progress bar, remaining/over-budget |
| **Pending Receivables/Payables** | Expected vs received from client, worker dues |
| **Monthly Breakdown** | Income and expense trends by month |
| **Category Breakdown** | Expense distribution by category |
| **Trade Breakdown** | Labor cost distribution by trade (Carpenter, Electrician, etc.) |

#### Export to CSV

Click the **"Export CSV"** button at the bottom to download a full report containing:
- All income transactions
- All expense transactions
- All labor entries
- Financial summary

The file is named: `{ProjectName}_Report.csv`

---

## 5. Vendors Management

Manage your vendor directory — suppliers, material shops, rental agencies, etc.

**Navigation:** Click **"Vendors"** in the sidebar or bottom bar.

<!-- 📸 SCREENSHOT: Visit /vendors — capture the vendors list with project tags -->

### Adding a Vendor

1. Click **"+ Add Vendor"**.
2. Fill in:

| Field | Required? | Description |
|-------|-----------|-------------|
| Vendor Name | ✅ Yes | e.g., "Shree Timber Works" |
| Phone | No | Contact number |
| Email | No | Email address |
| Category | No | Materials, Hardware, Furnishing, Rental, Transport, etc. |
| Address | No | Shop/office address |
| GST Number | No | For billing/invoicing |
| Notes | No | Any additional info |

3. Click **"Add Vendor"**.

### Features

- **Project Tags** — Each vendor card shows which projects they're assigned to (colored badges).
- **Edit / Delete** — Use the pencil/trash icons on each card.
- Vendors appear in the **expense form dropdown** when adding expenses to any project.

---

## 6. Contractors Management

Manage your contractor directory — carpenters, electricians, plumbers, painters, etc.

**Navigation:** Click **"Contractors"** in the sidebar or bottom bar.

<!-- 📸 SCREENSHOT: Visit /contractors — capture the contractors list showing payment summaries and project tags -->

### Adding a Contractor

1. Click **"+ Add Contractor"**.
2. Fill in:

| Field | Required? | Description |
|-------|-----------|-------------|
| Contractor Name | ✅ Yes | e.g., "Ramesh Kumar" |
| Phone | No | Contact number |
| Trade | ✅ Yes | Carpenter, Electrician, Plumber, Painter, Civil, Tiles, POP, etc. |
| Notes | No | Any additional info |

3. Click **"Add Contractor"**.

### Features

- **Payment Summary** — Each card shows total amount, paid, and due across all projects.
- **Active Jobs** — Shows how many ongoing labor entries the contractor has.
- **Project Tags** — Shows which projects they're assigned to.
- **Labor History** — Lists each project and labor entry with amounts and status.
- Contractors appear in the **labor form dropdown** and **expense form** (for subcontractor/labor categories).

---

## 7. Assigning Vendors & Contractors to Projects

You can associate vendors and contractors with specific projects for better organization.

### From the Project Overview Tab

1. Open any project → **Overview** tab.
2. Scroll to **"Assigned Vendors"** or **"Assigned Contractors"** cards.

<!-- 📸 SCREENSHOT: Visit /projects/[id] → Overview tab — capture the Assigned Vendors and Assigned Contractors cards -->

#### To Assign:

1. Click the **"Assign"** button.
2. A dropdown appears showing all available vendors/contractors not yet linked.
3. Click on one to assign it to the project.

#### To Remove:

- Click the **✕** icon next to any assigned vendor/contractor.

> **Benefit:** Assigned vendors/contractors show up as project tags on the Vendors and Contractors pages, making it easy to see who's working on what.

---

## 8. Client Portal

Clients can log in to view their project details, payment history, and milestones — **read-only access**.

### How Clients Get Access

1. When creating or editing a project, enter the **client's email**.
2. A portal login is **auto-created** with a generated password.
3. **Share the credentials** with the client (shown after creating/editing the project, or visible in the Overview → Project Info section).

### What Clients See

#### Portal Home (`/portal`)

<!-- 📸 SCREENSHOT: Log in as a client user → capture the portal home showing project cards -->

- **Welcome message** with client name
- **Summary cards**: Total Paid, Total Budget
- **Project cards** with status, paid amount, budget, and milestone progress
- Click any project to see details

#### Project Detail (`/portal/[id]`)

<!-- 📸 SCREENSHOT: Click on a project in client portal → capture the project detail view -->

- **Summary**: Budget, Total Paid, Remaining, Milestones progress
- **Payment History**: All payments received with dates and amounts
- **Milestones**: Progress and completion status
- **Project Phases**: Current status of each phase

> **Note:** Clients can only **view** data — they cannot add, edit, or delete anything.

---

## 9. Settings

**Navigation:** Click **"Settings"** in the sidebar or bottom bar.

<!-- 📸 SCREENSHOT: Visit /settings — capture the settings page with profile and password sections -->

### Update Profile

1. Edit your **Name** or **Email**.
2. Click **"Update Profile"**.

### Change Password

1. Enter your **Current Password**.
2. Enter and confirm your **New Password**.
3. Click **"Change Password"**.

### About

Shows app version (1.0.0), currency (Indian Rupee ₹), and data security information.

---

## 10. FAQs & Tips

### How do I track a contractor payment?

1. Go to the project → **Expenses** tab → **+ Add Expense**.
2. Set category to **"Labor"** or **"Subcontractor"**.
3. Select the contractor from the dropdown.
4. Link it to their **labor entry** using the "Link to Labor / Contractor" dropdown.
5. The payment will automatically update the "Paid" amount on the Labor tab.

### How do I know if a project is over budget?

- The **Dashboard** shows an "Over Budget" alert for any project exceeding its budget.
- Inside a project → **Overview** tab, the budget progress bar turns **red** if over budget.

### How do I share project updates with my client?

- Share the **client portal credentials** (visible in Project → Overview → Project Info).
- The client logs in and sees: payment history, milestones, phases, and budget.

### Can I export data?

- Yes! Go to any project → **Reports** tab → click **"Export CSV"**.
- The CSV includes all income, expenses, labor entries, and financial summary.

### What if I forgot to add client email during project creation?

- Go to the project → Overview tab → click **"Edit"** on the Project Info card.
- Add the client email and save.
- A portal login will be **auto-created** and the credentials will be shown to you.

### Can I assign the same vendor/contractor to multiple projects?

- Yes! Vendors and contractors are shared across the system. Assign them to as many projects as needed.

---

## Screenshot Capture Guide

To complete this document with screenshots, visit each URL listed below and capture the page:

| # | Page | URL |
|---|------|-----|
| 1 | Login | `/login` |
| 2 | Signup | `/signup` |
| 3 | Dashboard | `/dashboard` |
| 4 | New Project | `/projects/new` |
| 5 | Credentials Modal | Create project with client email |
| 6 | Project Detail | `/projects/[any-project-id]` |
| 7 | Overview Tab | Same page, Overview tab |
| 8 | Income Tab | Same page, Income tab |
| 9 | Expenses Tab | Same page, Expenses tab |
| 10 | Labor Tab | Same page, Labor tab |
| 11 | Milestones Tab | Same page, Milestones tab |
| 12 | Files Tab | Same page, Files tab |
| 13 | Notes Tab | Same page, Notes tab |
| 14 | Reports Tab | Same page, Reports tab |
| 15 | Vendors | `/vendors` |
| 16 | Contractors | `/contractors` |
| 17 | Settings | `/settings` |
| 18 | Client Portal Home | Log in as client → `/portal` |
| 19 | Client Project Detail | `/portal/[project-id]` |

Replace the `<!-- 📸 SCREENSHOT: ... -->` placeholders in this document with actual images:
```markdown
![Description](./screenshots/filename.png)
```

---

*Built with ❤️ by Kunal Jain*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Open POS

Open POS is an open-source point-of-sale system built for a small Mexican stationery store. It runs as a Next.js web application optimized for both desktop and mobile devices, handling the full sales workflow — from barcode scanning and product lookup to daily cash reconciliation and admin reporting.

---

## ✨ Current Features

### 🛒 Sales Screen (Ventas)

Scan a barcode or search by name to add products to the cart. Quantities and unit prices are editable inline. A frequent-products grid enables one-tap adds for common items. If a product isn't in the catalog it can be registered on the spot. Checkout calculates change automatically and records the transaction. Keyboard shortcuts keep the workflow fast for cashiers.

### 📦 Product Management (Productos)

Full CRUD for the product catalog with real-time search and filtering across 15 categories. Supports bulk price updates, category changes, and deletions across multiple products at once. PIN-protected.

### 🧾 Cash Reconciliation (Corte)

Enter the physically counted cash at the end of a shift and compare it against the system total. The difference is color-coded (match, overage, or shortage). Every sale in the session is expandable for line-item detail. Closing the session locks it against further sales. PIN-protected.

### 📊 Admin Dashboard

At-a-glance cards for today's revenue, transaction count, and monthly projection. Alerts for unclosed sessions from the previous day. A live transaction feed refreshes every 60 seconds alongside historical revenue charts.

### 🔐 Authentication & Access Control

Google OAuth sign-in with an email allowlist. Two roles: cashier (sales, products, corte) and admin (all screens). Sessions are JWT-based with a 30-day expiry.

### 🌐 UX & Localization

Mobile-first responsive layout with dark mode support. All UI text, dates, and currency are in Spanish (es-MX).

---

## 🗺️ Roadmap

### 🤖 AI Agent — Major Upcoming Update

The next major release will bring an AI agent directly into the POS, powered by [CopilotKit](https://www.copilotkit.ai). The agent connects to the database and lets you interact with your business data through natural language instead of reports and dashboards.

Ask it things like: *"What's the projected revenue for next year?"*, *"Which months historically see the highest sales for school supplies?"*, or *"What products should I restock before December?"* — and get actionable answers grounded in your actual transaction history.

Beyond analysis, the agent will be able to operate the system directly: querying, filtering, and surfacing insights across products, sessions, and sales without the user having to navigate screens manually.

---

## 🚀 Self-Hosting

### Prerequisites

- Node.js 18+ or Bun
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- A Google OAuth app for authentication

### Setup

```bash
git clone https://github.com/fcxmarquez/pos-personal-system.git
cd pos-personal-system
bun install
```

Create a `.env.local` file:

```env
# Get your connection string from https://console.neon.tech
DATABASE_URL="postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require"

AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# Comma-separated list of emails allowed to sign in
ALLOWED_EMAILS=""
# Comma-separated list of emails that receive admin access
ADMIN_EMAILS=""

# Store display name shown in the UI (defaults to "Papelería Luna")
NEXT_PUBLIC_STORE_NAME="Papelería Luna"

NEXT_PUBLIC_ADMIN_PIN="1234"

# Uncomment to bypass Google login for local development
# AUTH_BYPASS=true
```

Push the database schema and start the dev server:

```bash
bun db:push
bun dev
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Auth**: NextAuth.js v5
- **State**: Zustand (cart) + TanStack Query (server state)
- **UI**: shadcn/ui + Tailwind CSS
- **Package manager**: Bun

---

## 📄 License

MIT

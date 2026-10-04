# ExpenseTrack 💸

A personal finance tracker — minimal, portable, powerful. Built with Next.js, backed by Google Sheets.

## Features

- **Quick expense entry** — add transactions in 3 taps via numpad-first design
- **Rich categories** — hierarchical categories (Food → Eating Out, Sports → Badminton, etc.)
- **Deep analytics** — donut charts with drill-down, 6-month trends, daily heatmaps, top subcategories
- **Lend tracking** — track money lent/borrowed, partial settlements, net balances
- **Monthly & weekly reports** — comparison with previous period, savings rate
- **Portable** — all data stored in your own Google Sheet, easily exportable
- **Mobile-first** — installable PWA, thumb-friendly, smooth Framer Motion animations
- **Dark mode** — warm, earthy color palette (not the generic AI look)

## Setup

### 1. Clone and install
```bash
git clone <repo>
cd expensetrack
npm install
```

### 2. Google Cloud Setup

**Google OAuth (for sign-in):**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI
5. Copy Client ID and Client Secret

**Google Sheets API (for data storage):**
1. Enable Google Sheets API in your project
2. Create a Service Account (APIs & Services → Credentials → Service Account)
3. Download the JSON key file
4. Create a new Google Sheet, share it with your service account email as **Editor**
5. Copy the Sheet ID from the URL: `docs.google.com/spreadsheets/d/SHEET_ID/edit`

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Generate AUTH_SECRET:
```bash
npx auth secret
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

The app will automatically create and initialize the Google Sheet on first use.

## Deploy to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Change `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Add your Vercel URL to Google OAuth authorized redirect URIs

## Tech Stack

- **Next.js 16** (App Router)
- **Tailwind CSS v4** + custom design tokens
- **Framer Motion** — animations
- **Recharts** — charts
- **NextAuth v5** — Google Sign-In
- **Google Sheets API** — backend / database
- **Zustand** — client state
- **date-fns** — date handling

## Sheets Schema

The app creates 4 sheets automatically:
- `transactions` — all income, expenses, investments
- `lends` — money lent/borrowed and settlement status
- `categories` — customizable category hierarchy
- `config` — app settings (budget, payment method, theme)

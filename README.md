# Coinflipper

A full-stack DeFi token swap interface for Base and Ethereum networks, built with Next.js, TypeScript, and PostgreSQL.

## Features

- **Token Swapping** -- Swap ERC-20 tokens on Base and Ethereum via the Coinbase CDP SDK
- **Wallet Integration** -- Connect external wallets (MetaMask, Coinbase Wallet, WalletConnect) with Privy
- **Real-Time Pricing** -- Live swap price estimates with slippage, gas fees, and price impact
- **Token Discovery** -- Browse popular tokens and CoinGecko trending coins, or search by name/address
- **Trade History** -- View past swaps with status tracking, details modal, and CSV export
- **Transaction Tracking** -- Swap transactions are recorded in PostgreSQL and updated on-chain confirmation

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Wallet Auth**: Privy (`@privy-io/react-auth`)
- **Swap API**: Coinbase CDP SDK (`@coinbase/cdp-sdk`)
- **Token Data**: CoinGecko API
- **Database**: Prisma Postgres with Prisma 7 ORM
- **Deployment**: Vercel (or any Node.js hosting)

## Getting Started

### Prerequisites

- Node.js 18+
- [Prisma Postgres](https://console.prisma.io) database (or any PostgreSQL)
- API keys for: Coinbase CDP, Privy, CoinGecko

### Setup

1. Clone the repository:

```bash
git clone https://github.com/wesly-zhou/coinflipper.git
cd coinflipper
```

2. Install dependencies:

```bash
npm install
```

3. Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

4. Set up the database:

```bash
npx prisma migrate dev
```

5. (Optional) Seed sample data:

```bash
npm run db:seed
```

6. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Environment Variables

| Variable | Description |
|---|---|
| `CDP_API_KEY_ID` | Coinbase Developer Platform API key ID |
| `CDP_API_KEY_SECRET` | Coinbase Developer Platform API secret (PEM key) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID (public, used client-side) |
| `PRIVY_APP_SECRET_KEY` | Privy app secret (server-side only) |
| `COINGECKO_API_KEY` | CoinGecko API key |
| `DATABASE_URL` | Prisma Postgres connection string (`prisma+postgres://...`) |

## Project Structure

```
src/
├── app/                  # Next.js pages and API routes
│   ├── api/
│   │   ├── coingecko/    # Trending tokens endpoint
│   │   ├── swap-price/   # Price estimation endpoint
│   │   ├── swap-quote/   # Quote creation endpoint (authenticated)
│   │   ├── tokens/       # Token list endpoint
│   │   └── transactions/ # Transaction history CRUD
│   ├── history/          # Trade history page
│   └── page.tsx          # Home page with swap interface
├── components/
│   ├── layout/           # Header, Logo
│   ├── price/            # Price display
│   ├── providers/        # Privy auth provider
│   ├── swap/             # SwapInterface, TokenSelector
│   ├── trade/            # TradeHistory, TradeDetailModal
│   ├── ui/               # Button, Input, LoadingSpinner
│   └── wallet/           # ConnectWallet
├── hooks/                # useSwapPrice, useTokens, useTransactions, useDebounce
├── lib/                  # CDP client, Privy client, Prisma client, constants, transformers
└── types/                # TypeScript interfaces
prisma/
├── schema.prisma         # Database schema
├── migrations/           # Migration history
└── seed.ts               # Sample seed data
```

## Deploying to Vercel

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example` in the Vercel dashboard (use the same `DATABASE_URL` from your Prisma Postgres instance)
4. Deploy -- Prisma client is auto-generated via the `postinstall` script, and migrations are already applied to your Prisma Postgres database

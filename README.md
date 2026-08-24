# ChatOnYou Trade

ChatOnYou Trade is a full-stack AI-assisted paper-trading application built
with the Next.js App Router. It provides live crypto signals, paper accounts,
risk controls, analytics, backtesting, and optional Binance Spot Testnet
execution. It does not place real-money orders.

## Production

- Canonical application: https://chatonyou.com
- Vercel mirror: https://chatonyoutrade.vercel.app

The canonical application runs on OpenAI Sites/Cloudflare because its durable
paper accounts use D1, its authenticated application uses Sign in with
ChatGPT, and its Testnet credential vault uses a Cloudflare runtime secret.
The Vercel deployment serves the public Next.js experience and redirects
authenticated trading and API routes to the canonical application.

## Local development

Prerequisites: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

The Sites build is produced with `npm run build`. Vercel uses the build command
defined in `vercel.json`.

## Safety

- Paper trading is the default.
- Exchange integration is restricted to Binance Spot Testnet.
- Testnet credentials are encrypted before storage.
- No API keys or runtime secrets belong in this repository.

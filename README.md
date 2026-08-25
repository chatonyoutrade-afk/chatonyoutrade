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

## Configuration

All runtime configuration is read from the deployment environment. Nothing
below belongs in this repository.

| Variable | Purpose |
| --- | --- |
| `EXCHANGE_VAULT_KEY` | AES key for the Binance Testnet credential vault. |
| `KYC_ADMIN_EMAILS` | Comma-separated reviewer allowlist. Overrides the shipped default. |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Transactional email. Without them, password reset is unavailable and only allowlisted reviewers are verified. |
| `APP_ORIGIN` | Base URL used in emailed links. Defaults to the request origin. |
| `PASSWORD_HASH_ITERATIONS` | PBKDF2 work factor. The default costs ~37ms CPU, which exceeds a 10ms Workers free-plan limit. |
| `BINANCE_DATA_BASE_URL` | Candle feed host. Defaults to the public Binance data API; overridden in tests to serve fixture candles. |
| `KYC_PROVIDER`, `KYC_PROVIDER_MODE`, `KYC_PROVIDER_BASE_URL`, `KYC_PROVIDER_WORKFLOW_ID`, `KYC_PROVIDER_APP_ID`, `KYC_PROVIDER_APP_KEY` | Identity verification provider. Status is visible at `/admin/kyc/provider`. |

## Safety

- Paper trading is the default.
- Orders are rejected when the Binance candle feed is stale, when the signal
  the client reviewed has expired, or when the reviewed price has drifted from
  the live one. No price is ever displayed from a fallback constant.
- Exchange integration is restricted to Binance Spot Testnet.
- Testnet credentials are encrypted before storage.
- Accounts are first-party: PBKDF2 password hashes, session tokens stored only
  as digests, throttled sign-in, and KYC gated on a verified email address.
- A connected verification provider is a precondition for KYC approval, never a
  substitute for the reviewer's decision.
- No API keys or runtime secrets belong in this repository.

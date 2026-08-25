# ChatOnYou Trade

ChatOnYou Trade is a full-stack AI-assisted paper-trading application built
with the Next.js App Router. It provides live crypto signals, paper accounts,
risk controls, analytics, backtesting, and optional Binance Spot Testnet
execution. It does not place real-money orders.

## Production

The application runs on a Cloudflare Workers runtime: durable paper accounts
and KYC records use D1, sessions and password hashes are first-party, and the
Testnet credential vault uses a runtime secret. It is currently deployed to
https://chatonyou.com through OpenAI Sites.

The Vercel project at https://chatonyoutrade.vercel.app is **not** a public
mirror. Vercel Authentication is enabled for every deployment not served on a
custom domain, so those URLs are reachable by the team only. `vercel.json`
also redirects the trading, KYC, admin, API and auth routes to the canonical
application, because D1 and the Workers runtime do not exist on Vercel.

Vercel is therefore a build gate rather than hosting: every push is built and
type-checked there. A failed build leaves the previous deployment serving, so
enable Git commit comments on the project to notice one. Rolling back to an
older deployment is a Pro plan feature; on the current plan a bad deploy is
undone by reverting the commit and pushing.

## Local development

Prerequisites: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

The Sites build is produced with `npm run build`. Vercel uses the build command
defined in `vercel.json`.

Miniflare does not apply drizzle migrations to the local D1 database, so a
fresh checkout starts with no tables and every authenticated route fails. The
test suites apply the migrations themselves before they run, which is the
simplest way to prepare a local database:

```bash
npm test
```

The suites share that one local database and each resets the tables it owns,
so the runner is pinned to a single thread. `tests/risk-engine.test.mjs` serves
fixture candles over `BINANCE_DATA_BASE_URL` rather than reaching Binance, so
the suite runs without network access to the market data API.

## Configuration

All runtime configuration is read from the deployment environment. Nothing
below belongs in this repository.

| Variable | Purpose |
| --- | --- |
| `EXCHANGE_VAULT_KEY` | AES key for the Binance Testnet credential vault. |
| `KYC_ADMIN_EMAILS` | **Required for admin access.** Comma-separated reviewer allowlist. There is no default: a reviewer address shipped in this repository would be a published string granting access to whoever registers it first. A listed address must also be verified before it counts. |
| `EMAIL_API_KEY`, `EMAIL_FROM` | **Required.** An address is proven only by following a link sent to it, and KYC, trading and reviewer access all require a proven address — so without these the authenticated application is unreachable for everyone. Password reset is unavailable too. |
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

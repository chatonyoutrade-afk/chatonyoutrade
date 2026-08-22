# ChatOnYou Trade

Client-side, single-file paper-trading terminal. No backend, no real-money
execution — it simulates trades against live public market data entirely in
the browser and keeps state in `localStorage`.

- **`index.html`** — current version. Supports Crypto (Binance public
  market data, no key needed) and USA Stocks (Alpaca IEX, requires a
  user-supplied market-data key/secret kept only in the open tab).
- **`archive/index-v1-crypto-only.html`** — earlier crypto-only version,
  kept for reference.

Production: https://chatonyou.com

## How it works

An autopilot scores each tracked asset every few seconds using EMA trend,
RSI(14), momentum, and volatility on live 1-minute candles, and opens a
single virtual long position when the score clears a configurable
threshold. Position sizing, risk-per-trade, max allocation, and daily max
loss are all user-configurable risk controls. All fills are simulated with
an estimated fee + slippage; **no order is ever sent to an exchange or
broker.**

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import test from "node:test";

// This suite owns the shared dev D1 file while it runs, so the test runner
// must stay single-threaded: see the --test-concurrency=1 in npm test.
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const BASE = "http://127.0.0.1:4175";
const FIXTURE_PORT = 4176;
const D1_DIR = `${projectRoot}.wrangler/state/v3/d1/miniflare-D1DatabaseObject`;
const REVIEWER = "risk.tester@example.com";
const PASSWORD = "correct-horse-battery";

function openLocalD1() {
  const file = readdirSync(D1_DIR).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
  if (!file) throw new Error(`No dev D1 database under ${D1_DIR}. Start the dev server once first.`);
  return new DatabaseSync(`${D1_DIR}/${file}`);
}

function migrate(db) {
  const journal = JSON.parse(readFileSync(`${projectRoot}drizzle/meta/_journal.json`, "utf8"));
  for (const entry of journal.entries) {
    for (const statement of readFileSync(`${projectRoot}drizzle/${entry.tag}.sql`, "utf8").split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      try { db.exec(trimmed); } catch { /* Already applied. */ }
    }
  }
}

// A rising series with expanding volume, which the signal engine scores as BUY.
function bullishCandles(count = 100, start = 180) {
  const rows = [];
  for (let index = 0; index < count; index++) {
    const close = start + index * 0.35;
    const open = close - 0.15;
    rows.push([Date.now() - (count - index) * 60_000, String(open), String(close + 0.1), String(open - 0.1), String(close), index > count - 5 ? "5000" : "1000"]);
  }
  return rows;
}

function startFixtureFeed(state) {
  const server = createServer((request, response) => {
    if (state.down) { response.writeHead(503).end("feed down"); return; }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(state.rows));
  });
  return new Promise((resolve) => server.listen(FIXTURE_PORT, "127.0.0.1", () => resolve(server)));
}

function waitForPreview(server) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Preview did not start:\n${output}`)), 60_000);
    const onData = (chunk) => {
      output += chunk.toString();
      if (/Local:\s+http:\/\/(?:localhost|127\.0\.0\.1):4175/.test(output)) { clearTimeout(timeout); resolve(); }
    };
    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.once("exit", (code) => { clearTimeout(timeout); reject(new Error(`Preview exited with code ${code}:\n${output}`)); });
  });
}

const checkOf = (body, id) => (body.checks ?? []).find((check) => check.id === id);

test("the paper risk engine refuses orders the client cannot justify", { timeout: 240_000 }, async (t) => {
  const db = openLocalD1();
  migrate(db);
  for (const table of ["paper_trades", "paper_accounts", "paper_settings", "app_sessions", "app_users", "auth_throttle", "kyc_applications", "ai_decisions"]) {
    db.exec(`DELETE FROM ${table}`);
  }

  const feedState = { rows: bullishCandles(), down: false };
  const fixture = await startFixtureFeed(feedState);
  const server = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4175", "--strictPort"],
    {
      cwd: projectRoot,
      env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/risk-test.log", BINANCE_DATA_BASE_URL: `http://127.0.0.1:${FIXTURE_PORT}` },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let cookie = "";
  try {
    await waitForPreview(server);

    const registered = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: REVIEWER, password: PASSWORD, displayName: "Risk Tester", accepted: true }),
    });
    assert.equal(registered.status, 200);
    cookie = (registered.headers.get("set-cookie") ?? "").split(";")[0];

    // The order screens sit behind a verified address and an approved KYC.
    const now = Date.now();
    db.prepare("UPDATE app_users SET email_verified_at = ? WHERE email = ?").run(now, REVIEWER);
    db.prepare(`INSERT INTO kyc_applications (id,reference,user_email,user_display_name,full_name,birth_year,nationality,pan_last4,mobile_last4,city,state,pincode,id_type,evidence_summary,status,risk_level,review_note,review_checks,reviewed_by,submitted_at,updated_at,reviewed_at)
      VALUES ('fixture','KYC-FIXTURE',?,'Risk Tester','Risk Tester',1990,'Indian','1234','4321','Jaipur','Rajasthan','302006','Aadhaar','{}','approved','low','fixture','[]',?,?,?,?)`)
      .run(REVIEWER, REVIEWER, now, now, now);

    const signalResponse = await fetch(`${BASE}/api/signals?asset=SOL`, { headers: { cookie } });
    assert.equal(signalResponse.status, 200, "the fixture feed should produce a signal");
    const signal = await signalResponse.json();

    const validate = (overrides) => fetch(`${BASE}/api/trades`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "validate", asset: "SOL", side: signal.signal === "SELL" ? "SELL" : "BUY", amount: 500,
        entryPrice: signal.entry, stopPrice: signal.stopLoss, targetPrice: signal.takeProfit,
        confidence: signal.confidence, signalGeneratedAt: Date.now(), ...overrides,
      }),
    }).then((response) => response.json());

    await t.test("a freshly reviewed signal passes the feed, snapshot and drift checks", async () => {
      const body = await validate({});
      assert.equal(checkOf(body, "feed").ok, true);
      assert.equal(checkOf(body, "snapshot").ok, true, JSON.stringify(checkOf(body, "snapshot")));
      assert.equal(checkOf(body, "drift").ok, true, JSON.stringify(checkOf(body, "drift")));
    });

    await t.test("a snapshot older than the limit is refused", async () => {
      const body = await validate({ signalGeneratedAt: Date.now() - 120_000 });
      assert.equal(checkOf(body, "snapshot").ok, false);
      assert.equal(body.allowed, false);
    });

    await t.test("a missing snapshot timestamp is refused rather than assumed fresh", async () => {
      const body = await validate({ signalGeneratedAt: undefined });
      assert.equal(checkOf(body, "snapshot").ok, false);
      assert.equal(body.allowed, false);
    });

    await t.test("an entry price that has drifted from the live one is refused", async () => {
      const body = await validate({ entryPrice: signal.entry * 1.02 });
      assert.equal(checkOf(body, "drift").ok, false);
      assert.equal(body.allowed, false);
    });

    await t.test("a stale hardcoded price is refused", async () => {
      // The constant the order screen used to fall back to when the feed died.
      const body = await validate({ entryPrice: 182.44 });
      assert.equal(checkOf(body, "drift").ok, false);
    });

    await t.test("a dead feed refuses the order instead of using the last price", async () => {
      feedState.down = true;
      // The engine caches for 12s, so wait past it rather than reading a cached signal.
      await new Promise((resolve) => setTimeout(resolve, 13_000));
      const response = await fetch(`${BASE}/api/trades`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ asset: "SOL", side: "BUY", amount: 500, entryPrice: signal.entry, stopPrice: signal.stopLoss, targetPrice: signal.takeProfit, confidence: signal.confidence, signalGeneratedAt: Date.now() }),
      });
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /feed unavailable/i);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM paper_trades").get().count, 0, "no paper trade may exist after a refused order");
      feedState.down = false;
    });
  } finally {
    server.kill("SIGTERM");
    fixture.close();
    db.close();
  }
});

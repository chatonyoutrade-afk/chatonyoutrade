import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import test from "node:test";

// This suite owns the shared dev D1 file while it runs, so the test runner
// must stay single-threaded: see the --test-concurrency=1 in npm test.
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const BASE = process.env.CHATONYOU_TEST_BASE_URL ?? "http://127.0.0.1:4174";
const D1_DIR = `${projectRoot}.wrangler/state/v3/d1/miniflare-D1DatabaseObject`;

// The dev D1 file is created on first boot and named by a content hash, so it
// is discovered rather than hard-coded.
function openLocalD1() {
  const file = readdirSync(D1_DIR).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
  if (!file) throw new Error(`No dev D1 database under ${D1_DIR}. Start the dev server once first.`);
  return new DatabaseSync(`${D1_DIR}/${file}`);
}

// Miniflare does not run drizzle migrations, so the suite applies them itself.
function migrateAndReset(db) {
  const journal = JSON.parse(readFileSync(`${projectRoot}drizzle/meta/_journal.json`, "utf8"));
  for (const entry of journal.entries) {
    const sql = readFileSync(`${projectRoot}drizzle/${entry.tag}.sql`, "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      try { db.exec(trimmed); } catch { /* Already applied on a previous run. */ }
    }
  }
  for (const table of ["app_sessions", "app_users", "auth_throttle", "email_verifications", "password_resets"]) {
    db.exec(`DELETE FROM ${table}`);
  }
}

function waitForPreview(server) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Preview did not start:\n${output}`)), 60_000);
    const onData = (chunk) => {
      output += chunk.toString();
      if (/Local:\s+http:\/\/(?:localhost|127\.0\.0\.1):4174/.test(output)) {
        clearTimeout(timeout);
        resolve();
      }
    };
    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.once("exit", (code) => { clearTimeout(timeout); reject(new Error(`Preview exited with code ${code}:\n${output}`)); });
  });
}

const json = (path, options = {}) => fetch(`${BASE}${path}`, {
  ...options,
  headers: { "content-type": "application/json", ...(options.headers ?? {}) },
});

const REGISTER = { password: "correct-horse-battery", displayName: "Test User", accepted: true };

test("first-party accounts, throttling and verification", { timeout: 180_000 }, async (t) => {
  const db = openLocalD1();
  migrateAndReset(db);

  const server = process.env.CHATONYOU_TEST_BASE_URL ? null : spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4174", "--strictPort"],
    { cwd: projectRoot, env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/auth-test.log" }, stdio: ["ignore", "pipe", "pipe"] },
  );

  try {
    if (server) await waitForPreview(server);

    await t.test("registration normalises the email and opens a session", async () => {
      const response = await json("/api/auth/register", { method: "POST", body: JSON.stringify({ ...REGISTER, email: "Case.User@Example.com" }) });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.email, "case.user@example.com");
      const cookie = response.headers.get("set-cookie") ?? "";
      assert.match(cookie, /chatonyou_session=/);
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /Secure/i);
      assert.match(cookie, /SameSite=Lax/i);
    });

    await t.test("the session token is never stored in the database", () => {
      const stored = db.prepare("SELECT token_hash FROM app_sessions").all().map((row) => row.token_hash);
      assert.equal(stored.length, 1);
      // The cookie value cannot be recovered from the row, only its digest.
      assert.ok(stored[0].length >= 40);
    });

    await t.test("the password is stored only as a salted hash", () => {
      const user = db.prepare("SELECT password_hash, password_salt, password_iterations FROM app_users WHERE email = ?").get("case.user@example.com");
      assert.doesNotMatch(user.password_hash, /correct-horse-battery/);
      assert.ok(user.password_salt.length > 0);
      assert.ok(user.password_iterations >= 50_000);
    });

    await t.test("a short password and unaccepted terms are refused", async () => {
      const short = await json("/api/auth/register", { method: "POST", body: JSON.stringify({ ...REGISTER, email: "short@example.com", password: "tiny" }) });
      assert.equal(short.status, 400);
      const terms = await json("/api/auth/register", { method: "POST", body: JSON.stringify({ ...REGISTER, email: "terms@example.com", accepted: false }) });
      assert.equal(terms.status, 400);
    });

    await t.test("a duplicate registration is refused", async () => {
      const response = await json("/api/auth/register", { method: "POST", body: JSON.stringify({ ...REGISTER, email: "case.user@example.com" }) });
      assert.equal(response.status, 409);
    });

    await t.test("sign-in answers a wrong password and an unknown email identically", async () => {
      const wrong = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "case.user@example.com", password: "not-the-password" }) });
      const unknown = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "no-such-user@example.com", password: "not-the-password" }) });
      assert.equal(wrong.status, unknown.status);
      assert.deepEqual(await wrong.json(), await unknown.json());
      assert.equal(wrong.status, 401);
    });

    await t.test("sign-in locks after five failures and the correct password is refused too", async () => {
      db.exec("DELETE FROM auth_throttle");
      for (let attempt = 0; attempt < 5; attempt++) {
        const response = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "case.user@example.com", password: "not-the-password" }) });
        assert.equal(response.status, 401, `attempt ${attempt + 1} should still be 401`);
      }
      const locked = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "case.user@example.com", password: "not-the-password" }) });
      assert.equal(locked.status, 429);
      assert.ok(Number(locked.headers.get("retry-after")) > 0);
      const correct = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "case.user@example.com", password: REGISTER.password }) });
      assert.equal(correct.status, 429, "the lock must cover the correct password as well");
    });

    await t.test("a successful sign-in clears the failure counters", async () => {
      db.exec("DELETE FROM auth_throttle");
      await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "case.user@example.com", password: "not-the-password" }) });
      const response = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "case.user@example.com", password: REGISTER.password }) });
      assert.equal(response.status, 200);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM auth_throttle").get().count, 0);
    });

    await t.test("protected endpoints refuse an anonymous request", async () => {
      for (const path of ["/api/kyc", "/api/admin/kyc", "/api/trades", "/api/account"]) {
        const response = await fetch(`${BASE}${path}`);
        assert.equal(response.status, 401, `${path} must require authentication`);
        const body = await response.text();
        assert.doesNotMatch(body, /pan_last4|panLast4/i, `${path} must not leak KYC fields`);
      }
    });

    await t.test("an unverified account cannot reach KYC", async () => {
      const registered = await json("/api/auth/register", { method: "POST", body: JSON.stringify({ ...REGISTER, email: "unverified@example.com" }) });
      assert.equal(registered.status, 200);
      assert.equal((await registered.json()).emailVerified, false, "no mail provider means nobody is auto-verified");
      const cookie = (registered.headers.get("set-cookie") ?? "").split(";")[0];
      const response = await fetch(`${BASE}/api/kyc`, { headers: { cookie } });
      assert.equal(response.status, 403);
      assert.match((await response.json()).error, /Confirm your email address/);
    });

    await t.test("signing out ends the session", async () => {
      const signedIn = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "case.user@example.com", password: REGISTER.password }) });
      const cookie = (signedIn.headers.get("set-cookie") ?? "").split(";")[0];
      assert.equal((await fetch(`${BASE}/api/kyc`, { headers: { cookie } })).status, 403, "verified gate applies, but the session resolves");
      await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: { cookie } });
      assert.equal((await fetch(`${BASE}/api/kyc`, { headers: { cookie } })).status, 401, "the cookie must stop resolving after sign-out");
    });

    await t.test("password reset refuses to pretend when no mail provider is configured", async () => {
      const response = await json("/api/auth/reset", { method: "POST", body: JSON.stringify({ email: "case.user@example.com" }) });
      assert.equal(response.status, 503);
      assert.doesNotMatch(JSON.stringify(await response.json()), /sent|on its way/i);
    });
  } finally {
    server?.kill("SIGTERM");
    db.close();
  }
});

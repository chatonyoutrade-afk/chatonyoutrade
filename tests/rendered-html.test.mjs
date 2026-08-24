import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

function waitForPreview(server) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Preview did not start:\n${output}`)), 30_000);
    const onData = (chunk) => {
      output += chunk.toString();
      if (/Local:\s+http:\/\/(?:localhost|127\.0\.0\.1):4173/.test(output)) {
        clearTimeout(timeout);
        resolve();
      }
    };
    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Preview exited with code ${code}:\n${output}`));
    });
  });
}

test("renders ChatOnYou metadata and landing content", { timeout: 45_000 }, async () => {
  const existingPreview = process.env.CHATONYOU_TEST_BASE_URL;
  const server = existingPreview
    ? null
    : spawn(
        process.execPath,
        ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
        {
          cwd: projectRoot,
          env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/test.log" },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

  try {
    if (server) await waitForPreview(server);
    const response = await fetch(existingPreview ?? "http://127.0.0.1:4173/");
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    assert.match(html, /<title>ChatOnYou Trade — AI Trades, You Stay in Control<\/title>/);
    assert.match(html, /AI trades\./);
    assert.doesNotMatch(html, /name=["']codex-preview["']/i);
  } finally {
    server?.kill("SIGTERM");
  }
});

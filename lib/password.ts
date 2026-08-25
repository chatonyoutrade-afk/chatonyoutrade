// Password hashing for the Workers runtime. Web Crypto offers PBKDF2 but not
// bcrypt/argon2, so PBKDF2-SHA256 is what this platform can honestly provide.
//
// The default costs roughly 37ms of CPU per hash. That is comfortable inside a
// paid Workers CPU budget but exceeds the 10ms free-plan limit, so the count is
// configurable per deployment. Each user's count is stored with their hash, so
// changing this only affects passwords set afterwards and never locks anyone
// out. Lower it only alongside strict login throttling.
import { env } from "cloudflare:workers";

const DEFAULT_ITERATIONS = 210000;
const MIN_ITERATIONS = 50000;

function configuredIterations() {
  const raw = (env as unknown as Record<string, unknown>).PASSWORD_HASH_ITERATIONS;
  const value = Number(typeof raw === "string" ? raw : process.env.PASSWORD_HASH_ITERATIONS ?? "");
  if (!Number.isInteger(value) || value < MIN_ITERATIONS) return DEFAULT_ITERATIONS;
  return value;
}
const KEY_BITS = 256;
const SALT_BYTES = 16;

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" }, key, KEY_BITS);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iterations = configuredIterations();
  const hash = await derive(password, salt, iterations);
  return { hash: toBase64(hash), salt: toBase64(salt), iterations };
}

// Compares in constant time so a wrong password cannot be narrowed by timing.
export async function verifyPassword(password: string, stored: { hash: string; salt: string; iterations: number }) {
  let expected: Uint8Array;
  let actual: Uint8Array;
  try {
    expected = fromBase64(stored.hash);
    actual = await derive(password, fromBase64(stored.salt), stored.iterations);
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected[index] ^ actual[index];
  return difference === 0;
}

// Burns the same work as a real verification. Sign-in calls this when no
// account exists, so the response time does not reveal which addresses are
// registered — the identical body and status are not enough on their own.
export async function burnVerificationCost() {
  const salt = new Uint8Array(SALT_BYTES);
  await derive("", salt, configuredIterations());
  return false;
}

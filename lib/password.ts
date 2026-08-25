// Password hashing for the Workers runtime. Web Crypto offers PBKDF2 but not
// bcrypt/argon2, so PBKDF2-SHA256 at the OWASP-recommended work factor is what
// this platform can honestly provide.
const ITERATIONS = 210000;
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
  const hash = await derive(password, salt, ITERATIONS);
  return { hash: toBase64(hash), salt: toBase64(salt), iterations: ITERATIONS };
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

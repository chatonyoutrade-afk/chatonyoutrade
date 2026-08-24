import { env } from "cloudflare:workers";

type EncryptedValue = { ciphertext: string; iv: string };

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function vaultKey() {
  const secret = (env as unknown as Record<string, unknown>).EXCHANGE_VAULT_KEY;
  if (typeof secret !== "string" || !secret) {
    throw new Error("Secure credential vault is not configured");
  }
  const raw = base64ToBytes(secret);
  if (raw.byteLength !== 32) throw new Error("Secure credential vault key is invalid");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptCredentials(apiKey: string, apiSecret: string): Promise<EncryptedValue> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify({ apiKey, apiSecret }));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await vaultKey(), plaintext);
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

export async function decryptCredentials(ciphertext: string, iv: string) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    await vaultKey(),
    base64ToBytes(ciphertext),
  );
  const parsed = JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, unknown>;
  if (typeof parsed.apiKey !== "string" || typeof parsed.apiSecret !== "string") {
    throw new Error("Stored exchange credentials are invalid");
  }
  return { apiKey: parsed.apiKey, apiSecret: parsed.apiSecret };
}

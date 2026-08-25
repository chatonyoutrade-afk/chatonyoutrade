import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.TURSO_DATABASE_URL?.trim();

if (!url) {
  throw new Error("TURSO_DATABASE_URL is required for the Vercel build.");
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
});

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Turso schema is up to date.");
} finally {
  client.close();
}

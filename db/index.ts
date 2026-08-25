import { env } from "cloudflare:workers";
import { createClient, type Client } from "@libsql/client";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

let tursoClient: Client | undefined;
type AppDatabase = LibSQLDatabase<typeof schema>;

export function getD1() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return env.DB;
}

export function getDb(): AppDatabase {
  const url = process.env.TURSO_DATABASE_URL?.trim();

  if (url) {
    tursoClient ??= createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });

    return drizzleLibsql(tursoClient, { schema });
  }

  return drizzleD1(getD1(), { schema }) as unknown as AppDatabase;
}

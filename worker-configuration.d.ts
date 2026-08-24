declare module "cloudflare:workers" {
  export const env: {
    DB: D1Database;
    EXCHANGE_VAULT_KEY?: string;
    [key: string]: unknown;
  };
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
}

interface D1Result {
  meta: { changes?: number };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

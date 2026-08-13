import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/cursor_security";

const useSsl =
  process.env.DATABASE_SSL === "false"
    ? false
    : /render\.com|sslmode=require/i.test(connectionString);

const globalForDb = globalThis as unknown as {
  pg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pg ??
  postgres(connectionString, {
    max: 10,
    prepare: false,
    ssl: useSsl ? "require" : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pg = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;

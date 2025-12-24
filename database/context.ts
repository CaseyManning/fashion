import { AsyncLocalStorage } from "node:async_hooks";

import type { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { relations } from "./relations";
import type * as schema from "./schema";

export const DatabaseContext = new AsyncLocalStorage<
  ReturnType<typeof drizzle<typeof schema, typeof relations>>
>();

export function database() {
  const db = DatabaseContext.getStore();
  if (!db) {
    throw new Error("DatabaseContext not set");
  }
  return db;
}

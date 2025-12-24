import { createRequestHandler } from "@react-router/express";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import express from "express";
import postgres from "postgres";
import "react-router";
import { createContext, RouterContextProvider } from "react-router";

import { DatabaseContext } from "~/database/context";
import { relations } from "~/database/relations";
import * as schema from "~/database/schema";

export const VALUE_FROM_EXPRESS = createContext<string>("VALUE_FROM_EXPRESS");

export const app = express();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

declare global {
  // eslint-disable-next-line no-var
  var __drizzleDb__:
    | ReturnType<typeof drizzle<typeof schema, typeof relations>>
    | undefined;
}

let db: ReturnType<typeof drizzle<typeof schema, typeof relations>>;

if (process.env.NODE_ENV === "production") {
  db = drizzle(process.env.DATABASE_URL, { relations });
} else {
  if (!global.__drizzleDb__) {
    global.__drizzleDb__ = drizzle(process.env.DATABASE_URL, { relations });
  }
  db = global.__drizzleDb__;
}

// Attach db to AsyncLocalStorage per request
app.use((req, res, next) => {
  DatabaseContext.run(db, () => next());
});

app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
    getLoadContext() {
      const context = new RouterContextProvider();
      context.set(VALUE_FROM_EXPRESS, "Hello from Express");
      return context;
    },
  })
);

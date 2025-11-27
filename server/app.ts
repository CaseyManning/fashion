import { createRequestHandler } from "@react-router/express";
import { drizzle } from "drizzle-orm/postgres-js";
import express from "express";
import postgres from "postgres";
import "react-router";
import { createContext, RouterContextProvider } from "react-router";

import { DatabaseContext } from "~/database/context";
import * as schema from "~/database/schema";

export const VALUE_FROM_EXPRESS = createContext<string>("VALUE_FROM_EXPRESS");

export const app = express();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });
app.use((_, __, next) => DatabaseContext.run(db, next));

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

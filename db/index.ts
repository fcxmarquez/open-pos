import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

neonConfig.webSocketConstructor = ws;

declare global {
  // eslint-disable-next-line no-var
  var pool: Pool | undefined;
}

const dbPool =
  global.pool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

if (process.env.NODE_ENV !== "production") {
  global.pool = dbPool;
}

export const db = drizzle({ client: dbPool, schema });

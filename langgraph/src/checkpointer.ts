import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 4,
});

export const checkpointer = new PostgresSaver(pool);

// Setup runs async in the background; creates checkpoint tables if missing.
// The graph is ready synchronously — setup completes before any real request
// arrives on a warm server (or on the next retry if it fails on cold start).
checkpointer.setup().catch((err: unknown) => {
  console.error("[checkpointer] Failed to set up PostgresSaver tables:", err);
});

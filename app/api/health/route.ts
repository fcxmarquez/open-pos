import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { status: "error", message: "DATABASE_URL is not configured" },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT now() AS current_time`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      serverTime: result[0].current_time,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}

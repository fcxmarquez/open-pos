import { NextResponse } from "next/server";

/**
 * Returns the build identifier for the current deployment.
 * Clients compare this against their own baked-in NEXT_PUBLIC_BUILD_ID
 * to detect deployment skew and auto-reload when needed.
 */
export function GET() {
  return NextResponse.json(
    { buildId: process.env.NEXT_PUBLIC_BUILD_ID },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

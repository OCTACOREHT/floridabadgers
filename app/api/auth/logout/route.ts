import { NextResponse } from "next/server";

import { clearAuthSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );

  clearAuthSessionCookie(response);
  return response;
}

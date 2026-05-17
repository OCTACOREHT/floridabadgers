import { NextRequest, NextResponse } from "next/server";

import { clearAuthSessionCookie } from "@/lib/auth/session";
import { rejectCrossSiteRequest } from "@/lib/security/http-guard";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

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

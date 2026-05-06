import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUserFromRequest } from "@/lib/auth/session";

export async function requireApiUser(request: NextRequest): Promise<NextResponse | null> {
  const user = await getAuthenticatedUserFromRequest(request);
  if (user) return null;

  return NextResponse.json(
    { error: "Authentication required." },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

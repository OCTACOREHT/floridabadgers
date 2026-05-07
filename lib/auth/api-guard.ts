import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUserFromRequest, type AuthenticatedUser } from "@/lib/auth/session";

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

type RequireApiUserResult =
  | { user: AuthenticatedUser; response: null }
  | { user: null; response: NextResponse };

export async function requireApiUserWithUser(request: NextRequest): Promise<RequireApiUserResult> {
  const user = await getAuthenticatedUserFromRequest(request);
  if (user) {
    return { user, response: null };
  }

  return {
    user: null,
    response: NextResponse.json(
      { error: "Authentication required." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    ),
  };
}

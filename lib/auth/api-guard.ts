import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUserFromRequest, type AuthenticatedUser } from "@/lib/auth/session";
import { rejectCrossSiteRequest } from "@/lib/security/http-guard";

export async function requireApiUser(request: NextRequest): Promise<NextResponse | null> {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

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
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) {
    return { user: null, response: crossSiteResponse };
  }

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

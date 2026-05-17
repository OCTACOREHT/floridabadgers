import { NextRequest, NextResponse } from "next/server";
import { getUpslLivescores } from "@/lib/upsl";
import { enforceRateLimit } from "@/lib/security/http-guard";

export const runtime = "nodejs";

type LivescoreScope = "all" | "inplay" | "latest";

function parseScope(value: string | null): LivescoreScope {
  if (value === "inplay" || value === "latest") {
    return value;
  }
  return "all";
}

export async function GET(request: NextRequest) {
  const limiterResponse = enforceRateLimit(request, {
    keyPrefix: "upsl-livescores",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (limiterResponse) return limiterResponse;

  const scope = parseScope(request.nextUrl.searchParams.get("scope"));
  const team = request.nextUrl.searchParams.get("team")?.trim() || undefined;

  const result = await getUpslLivescores(scope, team);

  if (result.error) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result, { status: 200 });
}

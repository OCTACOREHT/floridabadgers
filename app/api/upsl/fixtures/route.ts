import { NextRequest, NextResponse } from "next/server";
import { getUpslFixturesBySeason } from "@/lib/upsl";
import { enforceRateLimit } from "@/lib/security/http-guard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limiterResponse = enforceRateLimit(request, {
    keyPrefix: "upsl-fixtures",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (limiterResponse) return limiterResponse;

  const seasonParam = request.nextUrl.searchParams.get("season");
  const parsedSeason = seasonParam ? Number.parseInt(seasonParam, 10) : 2026;
  const season = Number.isFinite(parsedSeason) ? parsedSeason : 2026;

  const result = await getUpslFixturesBySeason(season);

  if (result.error) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result, { status: 200 });
}

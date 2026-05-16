import { NextRequest, NextResponse } from "next/server";
import { getDashboardChartData } from "@/lib/dashboard/data";
import { requireApiUserWithUser } from "@/lib/auth/api-guard";
import { normalizeDashboardRole } from "@/lib/auth/permissions";

export const runtime = "nodejs";

function parseDays(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 90;
  return Math.max(7, Math.min(parsed, 180));
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUserWithUser(request);
  if (auth.response) return auth.response;
  const role = normalizeDashboardRole(auth.user?.role);
  if (role !== "admin" && role !== "media") {
    return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
  }

  try {
    const days = parseDays(request.nextUrl.searchParams.get("days"));
    const data = await getDashboardChartData(days);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

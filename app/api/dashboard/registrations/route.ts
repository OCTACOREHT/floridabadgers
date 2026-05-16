import { NextRequest, NextResponse } from "next/server";
import { getDashboardRegistrationRows } from "@/lib/dashboard/data";
import { requireApiUserWithUser } from "@/lib/auth/api-guard";
import { normalizeDashboardRole } from "@/lib/auth/permissions";

export const runtime = "nodejs";

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 80;
  return Math.max(10, Math.min(parsed, 300));
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUserWithUser(request);
  if (auth.response) return auth.response;
  const role = normalizeDashboardRole(auth.user?.role);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
  }

  try {
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const data = await getDashboardRegistrationRows(limit);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

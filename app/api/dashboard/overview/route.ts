import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverviewData } from "@/lib/dashboard/data";
import { requireApiUserWithUser } from "@/lib/auth/api-guard";
import { normalizeDashboardRole } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireApiUserWithUser(request);
  if (auth.response) return auth.response;
  const role = normalizeDashboardRole(auth.user?.role);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
  }

  try {
    const data = await getDashboardOverviewData();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

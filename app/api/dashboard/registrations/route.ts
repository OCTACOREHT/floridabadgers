import { NextRequest, NextResponse } from "next/server";
import { getDashboardRegistrationRows } from "@/lib/dashboard/data";
import { requireApiUser } from "@/lib/auth/api-guard";

export const runtime = "nodejs";

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 80;
  return Math.max(10, Math.min(parsed, 300));
}

export async function GET(request: NextRequest) {
  const guardResponse = await requireApiUser(request);
  if (guardResponse) return guardResponse;

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

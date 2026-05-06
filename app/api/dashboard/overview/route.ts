import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverviewData } from "@/lib/dashboard/data";
import { requireApiUser } from "@/lib/auth/api-guard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const guardResponse = await requireApiUser(request);
  if (guardResponse) return guardResponse;

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

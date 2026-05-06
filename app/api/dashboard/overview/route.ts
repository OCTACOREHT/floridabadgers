import { NextResponse } from "next/server";
import { getDashboardOverviewData } from "@/lib/dashboard/data";

export const runtime = "nodejs";

export async function GET() {
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


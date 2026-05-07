import { NextRequest, NextResponse } from "next/server";
import { getPublishedNewsArticles } from "@/lib/news.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 24;
  }
  return Math.max(1, Math.min(parsed, 60));
}

export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const articles = await getPublishedNewsArticles(limit);

  return NextResponse.json({ articles }, { status: 200 });
}

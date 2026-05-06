import { NextRequest, NextResponse } from "next/server";
import { trackSiteEvent } from "@/lib/analytics/events";

type TrackPayload = {
  path?: string;
  referrer?: string;
  timezone?: string;
};

function sanitize(value: unknown, maxLength = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TrackPayload;
    const path = sanitize(body.path, 250);
    if (!path) {
      return NextResponse.json({ error: "Missing path." }, { status: 400 });
    }

    const referrer = sanitize(body.referrer, 500);
    const timezone = sanitize(body.timezone, 80);
    const userAgent = sanitize(request.headers.get("user-agent"), 500);

    await trackSiteEvent({
      eventType: "page_view",
      path,
      source: "frontend",
      metadata: {
        referrer,
        timezone,
        userAgent,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

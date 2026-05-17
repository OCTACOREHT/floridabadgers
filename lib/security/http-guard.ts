import { NextRequest, NextResponse } from "next/server";

import { rateLimit } from "@/lib/security/rate-limit";

type RateLimitConfig = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  keySuffix?: string;
};

function toRetrySeconds(resetAt: number): string {
  const remainingMs = Math.max(resetAt - Date.now(), 0);
  return String(Math.ceil(remainingMs / 1000));
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function enforceRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(request);
  const suffix = config.keySuffix ? `:${config.keySuffix}` : "";
  const limiter = rateLimit(`${config.keyPrefix}:${ip}${suffix}`, config.limit, config.windowMs);

  if (!limiter.limited) return null;

  return NextResponse.json(
    { error: "Too many requests. Try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": toRetrySeconds(limiter.resetAt),
        "Cache-Control": "no-store",
      },
    }
  );
}

function parseAllowedOrigins(): Set<string> {
  const configured = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set(configured);
}

export function rejectCrossSiteRequest(request: NextRequest): NextResponse | null {
  const allowedOrigins = parseAllowedOrigins();
  allowedOrigins.add(request.nextUrl.origin);

  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    return NextResponse.json(
      { error: "Forbidden origin." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") {
    return NextResponse.json(
      { error: "Cross-site requests are not allowed." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  return null;
}

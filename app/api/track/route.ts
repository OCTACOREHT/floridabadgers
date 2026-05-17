import { NextRequest, NextResponse } from "next/server";
import { trackSiteEvent } from "@/lib/analytics/events";
import { enforceRateLimit, rejectCrossSiteRequest } from "@/lib/security/http-guard";

type TrackPayload = {
  path?: string;
  referrer?: string;
  timezone?: string;
  articleId?: string;
};

const US_TIMEZONES = new Set([
  "America/New_York",
  "America/Detroit",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Indiana/Indianapolis",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Vevay",
  "America/Chicago",
  "America/Indiana/Tell_City",
  "America/Indiana/Knox",
  "America/Menominee",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/North_Dakota/Beulah",
  "America/Denver",
  "America/Boise",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Juneau",
  "America/Sitka",
  "America/Metlakatla",
  "America/Yakutat",
  "America/Nome",
  "America/Adak",
  "Pacific/Honolulu",
  "US/Eastern",
  "US/Central",
  "US/Mountain",
  "US/Pacific",
  "US/Alaska",
  "US/Aleutian",
  "US/Hawaii",
]);

function countryNameFromCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (normalized === "HT") return "Haiti";
  if (normalized === "US") return "United States";
  if (normalized === "CA") return "Canada";
  if (normalized === "FR") return "France";
  if (normalized === "DO") return "Dominican Republic";
  if (normalized === "BR") return "Brazil";
  if (normalized === "MX") return "Mexico";
  return normalized;
}

function countryFromTimezone(timezone: string | null): string | null {
  if (!timezone) return null;
  const trimmed = timezone.trim();
  if (!trimmed) return null;
  if (trimmed === "America/Port-au-Prince") return "Haiti";
  if (US_TIMEZONES.has(trimmed)) return "United States";
  return null;
}

function detectCountry(request: NextRequest, timezone: string | null): {
  country: string | null;
  countryCode: string | null;
} {
  const headerCode = sanitize(request.headers.get("x-vercel-ip-country"), 5)
    ?? sanitize(request.headers.get("cf-ipcountry"), 5)
    ?? sanitize(request.headers.get("x-country-code"), 5);

  if (headerCode) {
    const code = headerCode.toUpperCase();
    return {
      country: countryNameFromCode(code),
      countryCode: code,
    };
  }

  const timezoneCountry = countryFromTimezone(timezone);
  if (timezoneCountry) {
    return {
      country: timezoneCountry,
      countryCode: timezoneCountry === "Haiti" ? "HT" : timezoneCountry === "United States" ? "US" : null,
    };
  }

  return { country: null, countryCode: null };
}

function sanitize(value: unknown, maxLength = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function isValidPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("://")) return false;
  return !/\s/.test(path);
}

export async function POST(request: NextRequest) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const limiterResponse = enforceRateLimit(request, {
    keyPrefix: "site-track",
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (limiterResponse) return limiterResponse;

  try {
    const body = (await request.json()) as TrackPayload;
    const path = sanitize(body.path, 250);
    if (!path || !isValidPath(path)) {
      return NextResponse.json({ error: "Missing path." }, { status: 400 });
    }

    const referrer = sanitize(body.referrer, 500);
    const timezone = sanitize(body.timezone, 80);
    const articleId = sanitize(body.articleId, 120);
    const userAgent = sanitize(request.headers.get("user-agent"), 500);
    const { country, countryCode } = detectCountry(request, timezone);

    await trackSiteEvent({
      eventType: "page_view",
      path,
      source: "frontend",
      metadata: {
        referrer,
        timezone,
        userAgent,
        articleId,
        country,
        countryCode,
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

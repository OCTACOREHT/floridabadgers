import { NextRequest, NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Origin-Agent-Cluster": "?1",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

function buildCspHeader(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://www.google.com/recaptcha/",
    "https://www.gstatic.com/recaptcha/",
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

function applySecurityHeaders(response: NextResponse) {
  const headers: Record<string, string> = {
    ...SECURITY_HEADERS,
    "Content-Security-Policy": buildCspHeader(),
  };

  for (const [header, value] of Object.entries(headers)) {
    response.headers.set(header, value);
  }

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

function isProtectedPage(pathname: string) {
  return pathname.startsWith("/dashboard");
}

function isProtectedApi(pathname: string) {
  return pathname.startsWith("/api/dashboard");
}

function isLoginPage(pathname: string) {
  return pathname === "/login" || pathname === "/admin";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_SESSION_COOKIE)?.value);

  if (!hasSession && (isProtectedPage(pathname) || isProtectedApi(pathname))) {
    if (isProtectedApi(pathname)) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Authentication required." }, { status: 401 })
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (hasSession && isLoginPage(pathname)) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)",
  ],
};

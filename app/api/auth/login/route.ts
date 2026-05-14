import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import WebSocket from "ws";

import { rateLimit } from "@/lib/security/rate-limit";
import { setAuthSessionCookie } from "@/lib/auth/session";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

export const runtime = "nodejs";
const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

type LoginInput = {
  email?: unknown;
  password?: unknown;
  captchaToken?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

function createSupabaseAuthClient() {
  return createClient(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), getSupabasePublicKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      transport: realtimeTransport,
    },
  });
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizePassword(value: unknown) {
  if (typeof value !== "string") return "";
  return value;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

function toRetrySeconds(resetAt: number): string {
  const remainingMs = Math.max(resetAt - Date.now(), 0);
  return String(Math.ceil(remainingMs / 1000));
}

export async function POST(request: NextRequest) {
  let body: LoginInput;

  try {
    body = (await request.json()) as LoginInput;

    const captchaResult = await verifyRecaptchaToken(body.captchaToken);
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error || "CAPTCHA verification failed." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = normalizePassword(body.password);

  if (!isEmail(email) || password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: "Email or password is invalid." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limiter = rateLimit(`auth-login:${ip}:${email}`, 12, 10 * 60 * 1000);
  if (limiter.limited) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": toRetrySeconds(limiter.resetAt),
        },
      }
    );
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );

  setAuthSessionCookie(response, data.session.access_token, data.session.expires_in);
  return response;
}

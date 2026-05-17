import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import WebSocket from "ws";

import { setAuthSessionCookie } from "@/lib/auth/session";
import { enforceRateLimit, rejectCrossSiteRequest } from "@/lib/security/http-guard";

export const runtime = "nodejs";
const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

type LoginInput = {
  email?: unknown;
  password?: unknown;
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

export async function POST(request: NextRequest) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  let body: LoginInput;

  try {
    body = (await request.json()) as LoginInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = normalizePassword(body.password);

  if (!isEmail(email) || password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: "Email or password is invalid." }, { status: 400 });
  }

  const limiterResponse = enforceRateLimit(request, {
    keyPrefix: "auth-login",
    keySuffix: email,
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (limiterResponse) return limiterResponse;

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

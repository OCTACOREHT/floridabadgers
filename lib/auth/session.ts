import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60;

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

let authClient: ReturnType<typeof createClient> | null = null;

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
  if (authClient) return authClient;

  authClient = createClient(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), getSupabasePublicKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return authClient;
}

function secureCookie() {
  return process.env.NODE_ENV === "production";
}

export function setAuthSessionCookie(response: NextResponse, accessToken: string, expiresIn?: number) {
  const maxAge =
    typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0
      ? Math.floor(expiresIn)
      : DEFAULT_SESSION_TTL_SECONDS;

  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: accessToken,
    httpOnly: true,
    secure: secureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export function clearAuthSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: secureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function getUserFromAccessToken(accessToken: string): Promise<AuthenticatedUser | null> {
  const trimmed = accessToken.trim();
  if (!trimmed) return null;

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(trimmed);

  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
  };
}

export async function getAuthenticatedUserFromRequest(
  request: Pick<NextRequest, "cookies">
): Promise<AuthenticatedUser | null> {
  const accessToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value ?? "";
  return getUserFromAccessToken(accessToken);
}

export async function getAuthenticatedUserFromServerCookies(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value ?? "";
  return getUserFromAccessToken(accessToken);
}

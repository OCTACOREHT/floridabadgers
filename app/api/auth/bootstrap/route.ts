import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/security/rate-limit"

type BootstrapBody = {
  email?: unknown
  password?: unknown
  fullName?: unknown
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().toLowerCase()
}

function normalizePassword(value: unknown) {
  if (typeof value !== "string") return ""
  return value
}

function normalizeFullName(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim()
}

function deriveFallbackName(email: string) {
  const localPart = email.split("@")[0] ?? "Admin"
  const cleaned = localPart.replace(/[._-]+/g, " ").trim()
  return cleaned.length > 0 ? cleaned : "Admin"
}

function isBootstrapEnabled() {
  return process.env.ENABLE_AUTH_BOOTSTRAP === "true" && process.env.NODE_ENV !== "production"
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get("x-real-ip")
  return realIp?.trim() || "unknown"
}

export async function POST(request: NextRequest) {
  if (!isBootstrapEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  const ip = getClientIp(request)
  const limiter = rateLimit(`auth-bootstrap:${ip}`, 5, 60 * 60 * 1000)
  if (limiter.limited) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  let body: BootstrapBody

  try {
    body = (await request.json()) as BootstrapBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  const password = normalizePassword(body.password)
  const fullName = normalizeFullName(body.fullName)

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  const { data: firstPage, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  })

  if (listError) {
    return NextResponse.json(
      { error: "Unable to verify auth state.", details: listError.message },
      { status: 500 }
    )
  }

  if ((firstPage?.users?.length ?? 0) > 0) {
    return NextResponse.json(
      { error: "Authentication is already initialized.", code: "already_initialized" },
      { status: 409 }
    )
  }

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  const { error: publicUserError } = await supabase.from("users").upsert(
    {
      full_name: fullName || deriveFallbackName(email),
      email,
      role: "user",
    },
    { onConflict: "email" }
  )

  if (publicUserError) {
    return NextResponse.json(
      {
        error: "Auth account created, but failed to sync public users table.",
        details: publicUserError.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      userId: createdUser.user?.id ?? null,
    },
    { status: 201 }
  )
}

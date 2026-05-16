import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireApiUser, requireApiUserWithUser } from "@/lib/auth/api-guard";
import {
  getDashboardTableConfig,
  getDashboardTableRows,
  normalizeTablePayload,
} from "@/lib/dashboard/tables";
import { resolveArticleAuthorId } from "@/lib/dashboard/article-author";

export const runtime = "nodejs";

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 80;
  return Math.max(1, Math.min(parsed, 300));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  const guardResponse = await requireApiUser(request);
  if (guardResponse) return guardResponse;

  const { table } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  const user = await getAuthenticatedUserFromRequest(request);
  const isAdmin = user?.role === "admin";
  const isFinance = user?.role === "finance";
  const allowedTablesForFinance = ["paiements", "users"];

  if (isFinance && !allowedTablesForFinance.includes(table)) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to view this table." }, { status: 403 });
  }

  if (!isAdmin && !isFinance) {
    return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
  }

  try {
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const data = await getDashboardTableRows(table, limit);
    return NextResponse.json({ table, config, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  const auth = await requireApiUserWithUser(request);
  if (auth.response) return auth.response;
  const authenticatedUser = auth.user;

  const { table } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    
    const isAdmin = authenticatedUser?.role === "admin";
    const isFinance = authenticatedUser?.role === "finance";
    const allowedTablesForFinance = ["paiements", "users"];

    if (isFinance && !allowedTablesForFinance.includes(table)) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to modify this table." }, { status: 403 });
    }

    if (!isAdmin && !isFinance) {
      return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
    }

    // Security: Non-admins can only create/edit THEIR OWN user record
    if (table === "users" && !isAdmin) {
       // In POST (create), we generally don't allow non-admins to create users anyway
       if (request.method === "POST") {
          return NextResponse.json({ error: "Only admins can create new users." }, { status: 403 });
       }
    }

    const payload = normalizeTablePayload(table, body, "create");
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid fields supplied." }, { status: 400 });
    }

    // Custom logic for users table (Supabase Auth integration)
    if (table === "users") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      const confirmPassword = String(body.confirm_password || "").trim();

      if (!email) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
      }
      if (!password) {
        return NextResponse.json({ error: "Password is required." }, { status: 400 });
      }
      if (password !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
      }

      const supabase = createSupabaseServiceClient();
      
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: payload.full_name,
          role: payload.role
        }
      });

      if (authError) {
        return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 400 });
      }

      const authUser = authData.user;
      if (!authUser) {
        return NextResponse.json({ error: "Failed to create auth user." }, { status: 400 });
      }

      // 2. Set the ID of the public user to match the Auth user
      payload.id = authUser.id;

      // Remove transient fields
      for (const field of config.createFields) {
        if (field.transient) {
          delete payload[field.key];
        }
      }

      // 3. Create the record in the public users table
      const { data: userData, error: userError } = await supabase
        .from(config.table)
        .insert(payload)
        .select("*")
        .single();

      if (userError) {
        // Cleanup: try to delete the auth user if the public record fails?
        // For now, just report the error.
        return NextResponse.json({ error: `Database Error: ${userError.message}` }, { status: 400 });
      }

      return NextResponse.json({ data: userData }, { status: 201 });
    }

    const supabase = createSupabaseServiceClient();
    if (table === "actualites" && payload.is_published === true) {
      payload.auteur_id = await resolveArticleAuthorId(supabase, authenticatedUser.email);
    }

    const { data, error } = await supabase
      .from(config.table)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Don't return password in response
    if (data && "password" in data) {
      delete (data as any).password;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

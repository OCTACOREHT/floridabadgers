import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getDashboardTableConfig, normalizeTablePayload } from "@/lib/dashboard/tables";
import { requireApiUser, requireApiUserWithUser } from "@/lib/auth/api-guard";
import { resolveArticleAuthorId } from "@/lib/dashboard/article-author";

export const runtime = "nodejs";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ table: string; id: string }> }
) {
  const auth = await requireApiUserWithUser(request);
  if (auth.response) return auth.response;
  const authenticatedUser = auth.user;

  const { table, id } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid row id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeTablePayload(table, body, "update");
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid fields supplied." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    if (table === "actualites" && payload.is_published === true) {
      const { data: currentArticle, error: currentArticleError } = await supabase
        .from(config.table)
        .select("is_published, auteur_id")
        .eq("id", id)
        .maybeSingle();

      if (currentArticleError) {
        return NextResponse.json({ error: currentArticleError.message }, { status: 400 });
      }

      const shouldAssignAuthor =
        !currentArticle || currentArticle.is_published !== true || !currentArticle.auteur_id;

      if (shouldAssignAuthor) {
        payload.auteur_id = await resolveArticleAuthorId(supabase, authenticatedUser.email);
      }
    }

    const { data, error } = await supabase
      .from(config.table)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ table: string; id: string }> }
) {
  const guardResponse = await requireApiUser(request);
  if (guardResponse) return guardResponse;

  const { table, id } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid row id." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from(config.table).delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

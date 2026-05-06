import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getDashboardTableConfig, normalizeTablePayload } from "@/lib/dashboard/tables";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeTablePayload(table, body, "update");
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid fields supplied." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
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
  _request: NextRequest,
  context: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
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


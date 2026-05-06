import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import {
  getDashboardTableConfig,
  getDashboardTableRows,
  normalizeTablePayload,
} from "@/lib/dashboard/tables";

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
  const guardResponse = await requireApiUser(request);
  if (guardResponse) return guardResponse;

  const { table } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeTablePayload(table, body, "create");
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid fields supplied." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from(config.table)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

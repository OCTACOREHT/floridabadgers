import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  nom: string;
  description: string | null;
};

function parseUCategoryRank(name: string): number | null {
  const match = name.trim().match(/^u\s*(\d{1,2})$/i);
  if (!match) return null;

  const value = Number.parseInt(match[1], 10);
  if (!Number.isFinite(value)) return null;
  return value;
}

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("categories")
      .select("id, nom, description")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sorted = ((data ?? []) as CategoryRow[]).slice().sort((a, b) => {
      const aRank = parseUCategoryRank(a.nom);
      const bRank = parseUCategoryRank(b.nom);

      if (aRank !== null && bRank !== null) return aRank - bRank;
      if (aRank !== null) return -1;
      if (bRank !== null) return 1;
      return a.nom.localeCompare(b.nom, "en", { sensitivity: "base" });
    });

    return NextResponse.json({ data: sorted }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("hero_slides")
      .select("id, image_url, titre, sous_titre, ordre")
      .eq("is_active", true)
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ slides: data ?? [] }, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=120",
      },
    });
  } catch (error) {
    console.error("[hero-slides] Failed to load slides", error);
    return NextResponse.json({ slides: [], error: "Failed to load slides" }, { status: 500 });
  }
}

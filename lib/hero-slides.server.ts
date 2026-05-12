import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type HeroSlide = {
  id: string;
  image_url: string;
  titre: string | null;
  sous_titre: string | null;
  ordre: number;
  is_active: boolean;
};

export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("ordre", { ascending: true });

    if (error) {
      console.error("[hero-slides] Database error:", error);
      return [];
    }

    return (data as HeroSlide[]) || [];
  } catch (err) {
    console.error("[hero-slides] Unexpected error:", err);
    return [];
  }
}

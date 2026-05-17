import QuickPaymentForm from "@/components/dashboard/quick-payment-form";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type QuickPaymentPlayer = {
  id: string;
  prenom: string;
  nom: string;
  categorie?: { nom: string };
};

export default async function QuickPaymentPage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const isAdmin = user?.role === "admin";
  const isFinance = user?.role === "finance";

  if (!isAdmin && !isFinance) {
    redirect("/dashboard?error=unauthorized");
  }

  const supabase = createSupabaseServiceClient();
  const { data: players } = await supabase
    .from("joueurs")
    .select("id, prenom, nom, categorie:categorie_id ( nom )")
    .order("nom", { ascending: true });

  const normalizedPlayers = (players ?? [])
    .map((player): QuickPaymentPlayer | null => {
      if (!player || typeof player !== "object") return null;

      const playerRecord = player as {
        id?: unknown;
        prenom?: unknown;
        nom?: unknown;
        categorie?: unknown;
      };
      const categoryRelation = playerRecord.categorie;
      const categoryName = (
        categoryRelation &&
        typeof categoryRelation === "object" &&
        !Array.isArray(categoryRelation) &&
        typeof (categoryRelation as { nom?: unknown }).nom === "string"
      )
        ? (categoryRelation as { nom: string }).nom
        : null;

      if (
        typeof playerRecord.id !== "string" ||
        typeof playerRecord.prenom !== "string" ||
        typeof playerRecord.nom !== "string"
      ) {
        return null;
      }

      return {
        id: playerRecord.id,
        prenom: playerRecord.prenom,
        nom: playerRecord.nom,
        ...(categoryName ? { categorie: { nom: categoryName } } : {}),
      };
    })
    .filter((player): player is QuickPaymentPlayer => player !== null);

  return <QuickPaymentForm players={normalizedPlayers} />;
}

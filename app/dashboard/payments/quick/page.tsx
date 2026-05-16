import QuickPaymentForm from "@/components/dashboard/quick-payment-form";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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

  return <QuickPaymentForm players={(players as any) || []} />;
}

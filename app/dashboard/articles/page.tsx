import { redirect } from "next/navigation";

import { DashboardTableManager } from "@/components/dashboard/table-manager";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { normalizeDashboardRole } from "@/lib/auth/permissions";
import { getDashboardTableConfig, getDashboardTableRows } from "@/lib/dashboard/tables";

export const dynamic = "force-dynamic";

export default async function DashboardArticlesPage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const role = normalizeDashboardRole(user?.role);
  if (role !== "admin" && role !== "media") {
    redirect("/dashboard?error=unauthorized");
  }

  const config = getDashboardTableConfig("actualites");
  if (!config) {
    throw new Error("Articles table configuration is missing.");
  }

  const initialRows = await getDashboardTableRows(config.table, 120);

  return (
    <DashboardTableManager
      key={config.table}
      config={config}
      initialRows={initialRows}
      currentUser={user ?? undefined}
    />
  );
}

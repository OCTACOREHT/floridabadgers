import { notFound, redirect } from "next/navigation";

import { DashboardTableManager } from "@/components/dashboard/table-manager";
import { getDashboardTableConfig, getDashboardTableRows } from "@/lib/dashboard/tables";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { canAccessDashboardTable, normalizeDashboardRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardTablePage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    notFound();
  }

  const user = await getAuthenticatedUserFromServerCookies();
  const role = normalizeDashboardRole(user?.role);
  const isAdmin = role === "admin";

  if (!canAccessDashboardTable(role, table)) {
    redirect("/dashboard?error=unauthorized");
  }
  
  let initialRows = await getDashboardTableRows(table, 120);

  // Security: Non-admins can only see themselves in the users table
  if (table === "users" && !isAdmin && user) {
    initialRows = initialRows.filter(row => row.id === user.id);
  }

  return (
    <DashboardTableManager 
      key={config.table} 
      config={config} 
      initialRows={initialRows} 
      currentUser={user ?? undefined}
    />
  );
}

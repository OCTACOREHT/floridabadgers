import { notFound, redirect } from "next/navigation";

import { DashboardTableManager } from "@/components/dashboard/table-manager";
import { getDashboardTableConfig, getDashboardTableRows } from "@/lib/dashboard/tables";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";

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
  const isAdmin = user?.role === "admin";
  const isFinance = user?.role === "finance";

  // Security: Role-based Table Access Control
  const allowedTablesForFinance = ["paiements", "users"];
  
  if (isFinance && !allowedTablesForFinance.includes(table)) {
    redirect("/dashboard?error=unauthorized");
  }

  // If not admin and not finance, and trying to access something else (safety net)
  if (!isAdmin && !isFinance) {
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

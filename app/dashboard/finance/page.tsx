import { redirect } from "next/navigation";

import FinanceDashboard from "@/components/dashboard/finance-dashboard";
import { getDashboardFinanceData } from "@/lib/dashboard/data";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { normalizeDashboardRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function FinanceDashboardPage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const role = normalizeDashboardRole(user?.role);
  if (role !== "admin" && role !== "finance") {
    redirect("/dashboard?error=unauthorized");
  }

  const financeData = await getDashboardFinanceData();
  return <FinanceDashboard data={financeData} />;
}

import ReportsDashboard from "@/components/dashboard/reports-dashboard";
import { getReportsData } from "@/lib/dashboard/data";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const isAdmin = user?.role === "admin";
  const isFinance = user?.role === "finance";

  // Security: Only Admin and Finance can see the reports
  if (!isAdmin && !isFinance) {
    redirect("/dashboard?error=unauthorized");
  }

  const data = await getReportsData();
  
  return <ReportsDashboard data={data} />;
}

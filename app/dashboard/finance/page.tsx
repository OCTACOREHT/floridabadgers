import FinanceDashboard from "@/components/dashboard/finance-dashboard";
import { getDashboardFinanceData } from "@/lib/dashboard/data";

export const dynamic = "force-dynamic";

export default async function FinanceDashboardPage() {
  const financeData = await getDashboardFinanceData();
  return <FinanceDashboard data={financeData} />;
}


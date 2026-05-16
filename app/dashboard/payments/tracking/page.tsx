import PaymentTracking from "@/components/dashboard/payment-tracking";
import { getDashboardFinanceData, getReportsData } from "@/lib/dashboard/data";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PaymentTrackingPage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const role = user?.role;

  if (role !== "admin" && role !== "finance") {
    redirect("/dashboard?error=unauthorized");
  }

  const [reports, finance] = await Promise.all([
    getReportsData(),
    getDashboardFinanceData(),
  ]);
  
  return (
    <PaymentTracking
      data={{
        reportRows: reports.reportRows,
        totalRevenue: reports.totalRevenue,
        paymentCount: reports.paymentCount,
        chartData: finance.chartData,
      }}
    />
  );
}

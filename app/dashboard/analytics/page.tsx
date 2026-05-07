import { DashboardAnalyticsCharts } from "@/components/dashboard/analytics-charts"
import { getDashboardAnalyticsData } from "@/lib/dashboard/data"

export const dynamic = "force-dynamic"

export default async function DashboardAnalyticsPage() {
  const analyticsData = await getDashboardAnalyticsData()

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Traffic, visitors, and article performance.
        </p>
      </div>
      <DashboardAnalyticsCharts data={analyticsData} />
    </div>
  )
}

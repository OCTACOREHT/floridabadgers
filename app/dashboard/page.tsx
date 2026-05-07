import { DashboardAnalyticsCharts } from "@/components/dashboard/analytics-charts"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import {
  getDashboardAnalyticsData,
  getDashboardChartData,
  getDashboardOverviewData,
  getDashboardRegistrationRows,
} from "@/lib/dashboard/data"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [overview, chartData, analyticsData, registrations] = await Promise.all([
    getDashboardOverviewData(),
    getDashboardChartData(90),
    getDashboardAnalyticsData(),
    getDashboardRegistrationRows(120),
  ])

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards data={overview} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={chartData} />
      </div>
      <DashboardAnalyticsCharts data={analyticsData} />
      <DataTable data={registrations} />
    </div>
  )
}

"use client"

import type { DashboardOverviewData } from "@/lib/dashboard/data"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

function formatTrend(value: number): string {
  const absolute = Math.abs(value).toFixed(1)
  return `${value >= 0 ? "+" : "-"}${absolute}%`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

function TrendBadge({ value }: { value: number }) {
  const isUp = value >= 0
  return (
    <Badge variant="outline">
      {isUp ? <TrendingUpIcon /> : <TrendingDownIcon />}
      {formatTrend(value)}
    </Badge>
  )
}

export function SectionCards({ data }: { data: DashboardOverviewData }) {
  const pendingRatio = `${data.pendingRatioPct.toFixed(1)}%`

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Registrations</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.totalRegistrations)}
          </CardTitle>
          <CardAction>
            <TrendBadge value={data.registrationsTrendPct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Registration trend{" "}
            {data.registrationsTrendPct >= 0 ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Registrations</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.pendingRegistrations)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {pendingRatio}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pending ratio on total registrations{" "}
            <TrendingUpIcon className="size-4" />
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Players</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.activePlayers)}
          </CardTitle>
          <CardAction>
            <TrendBadge value={data.activePlayersTrendPct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Active players trend (30d){" "}
            {data.activePlayersTrendPct >= 0 ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Page Views (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.monthlyPageViews)}
          </CardTitle>
          <CardAction>
            <TrendBadge value={data.pageViewsTrendPct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Traffic trend{" "}
            {data.pageViewsTrendPct >= 0 ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

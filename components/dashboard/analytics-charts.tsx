"use client"

import * as React from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DashboardAnalyticsData } from "@/lib/dashboard/data"

type Props = {
  data: DashboardAnalyticsData
}

const browserChartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

const radarChartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--chart-1)",
  },
  registrations: {
    label: "Registrations",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const topArticlesChartConfig = {
  visitors: {
    label: "Views",
  },
} satisfies ChartConfig

const countryChartConfig = {
  visitors: {
    label: "Visitors",
  },
} satisfies ChartConfig

const topPagesChartConfig = {
  visitors: {
    label: "Views",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

function computeTrend(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

function formatTrend(value: number): string {
  const sign = value >= 0 ? "+" : "-"
  return `${sign}${Math.abs(value).toFixed(1)}%`
}

function TrendLine({ trend, prefix }: { trend: number; prefix: string }) {
  const isUp = trend >= 0
  return (
    <div className="flex items-center gap-2 leading-none font-medium">
      {prefix} {formatTrend(trend)} {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
    </div>
  )
}

export function DashboardAnalyticsCharts({ data }: Props) {
  const totalBrowserVisitors = React.useMemo(
    () => data.browserShare.reduce((acc, item) => acc + item.visitors, 0),
    [data.browserShare]
  )

  const monthlyData = React.useMemo(() => {
    if (data.monthlyTraffic.length > 0) return data.monthlyTraffic
    return [
      { month: "Jan", visitors: 0, registrations: 0 },
      { month: "Feb", visitors: 0, registrations: 0 },
      { month: "Mar", visitors: 0, registrations: 0 },
      { month: "Apr", visitors: 0, registrations: 0 },
      { month: "May", visitors: 0, registrations: 0 },
      { month: "Jun", visitors: 0, registrations: 0 },
    ]
  }, [data.monthlyTraffic])

  const monthlyVisitorsTrend = React.useMemo(() => {
    if (monthlyData.length < 2) return 0
    const halfIndex = Math.floor(monthlyData.length / 2)
    const previous = monthlyData.slice(0, halfIndex).reduce((sum, item) => sum + item.visitors, 0)
    const current = monthlyData.slice(halfIndex).reduce((sum, item) => sum + item.visitors, 0)
    return computeTrend(current, previous)
  }, [monthlyData])

  const topArticles = React.useMemo(() => data.topArticles.slice(0, 5), [data.topArticles])
  const countryShare = React.useMemo(() => data.countryShare.slice(0, 6), [data.countryShare])
  const totalCountryVisitors = React.useMemo(
    () => countryShare.reduce((acc, item) => acc + item.visitors, 0),
    [countryShare]
  )
  const topPages = React.useMemo(() => data.topPages.slice(0, 8), [data.topPages])

  return (
    <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-5">
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Visitors by Browser</CardTitle>
          <CardDescription>Last 6 months of tracked traffic</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={browserChartConfig}
            className="mx-auto aspect-square max-h-[260px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data.browserShare}
                dataKey="visitors"
                nameKey="browser"
                innerRadius={62}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalBrowserVisitors.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Visitors
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="leading-none text-muted-foreground">Browser distribution from real page views</div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle>Visitors vs Registrations</CardTitle>
          <CardDescription>Monthly trend for the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <ChartContainer
            config={radarChartConfig}
            className="mx-auto aspect-square max-h-[260px]"
          >
            <RadarChart data={monthlyData}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <PolarAngleAxis dataKey="month" />
              <PolarGrid radialLines={false} />
              <Radar
                dataKey="visitors"
                fill="var(--color-visitors)"
                fillOpacity={0}
                stroke="var(--color-visitors)"
                strokeWidth={2}
              />
              <Radar
                dataKey="registrations"
                fill="var(--color-registrations)"
                fillOpacity={0}
                stroke="var(--color-registrations)"
                strokeWidth={2}
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <TrendLine trend={monthlyVisitorsTrend} prefix="Traffic change:" />
          <div className="leading-none text-muted-foreground">Based on tracked page views and registrations</div>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Top Viewed Articles</CardTitle>
          <CardDescription>Highest article traffic on /news/article/*</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          {topArticles.length > 0 ? (
            <ChartContainer
              config={topArticlesChartConfig}
              className="mx-auto aspect-square max-h-[260px]"
            >
              <RadialBarChart
                data={topArticles}
                startAngle={-90}
                endAngle={380}
                innerRadius={24}
                outerRadius={108}
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="article" />}
                />
                <RadialBar dataKey="visitors" background>
                  <LabelList
                    position="insideStart"
                    dataKey="article"
                    className="fill-white capitalize mix-blend-luminosity"
                    fontSize={11}
                  />
                </RadialBar>
              </RadialBarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No article views yet.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="leading-none text-muted-foreground">Data comes from tracked article page views</div>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Visitors by Country</CardTitle>
          <CardDescription>Includes Haiti, USA, and other countries</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          {countryShare.length > 0 ? (
            <ChartContainer
              config={countryChartConfig}
              className="mx-auto aspect-square max-h-[260px]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="country" />} />
                <Pie
                  data={countryShare}
                  dataKey="visitors"
                  nameKey="country"
                  innerRadius={58}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalCountryVisitors.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Visitors
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No country data yet.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="leading-none text-muted-foreground">
            Country inferred from request headers and timezone fallback
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Visited Pages</CardTitle>
          <CardDescription>Top website pages by total views</CardDescription>
        </CardHeader>
        <CardContent>
          {topPages.length > 0 ? (
            <ChartContainer config={topPagesChartConfig}>
              <BarChart
                accessibilityLayer
                data={topPages}
                layout="vertical"
                margin={{
                  right: 20,
                }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="page"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  hide
                />
                <XAxis dataKey="visitors" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4}>
                  <LabelList
                    dataKey="page"
                    position="insideLeft"
                    offset={8}
                    className="fill-(--color-label)"
                    fontSize={12}
                  />
                  <LabelList
                    dataKey="visitors"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No page view data yet.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="leading-none text-muted-foreground">
            Pages are ranked by real tracked views
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

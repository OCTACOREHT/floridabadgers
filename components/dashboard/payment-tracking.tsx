"use client";

import { SearchIcon, CheckCircle2Icon, AlertCircleIcon, BarChart3Icon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { DashboardFinanceChart } from "@/components/dashboard/finance-chart";

interface TrackingRow {
  id: string;
  name: string;
  category: string;
  monthlyFee: number;
  paidThisMonth: boolean;
  totalPaid: number;
  lastPayment: string;
}

interface PaymentTrackingProps {
  data: {
    reportRows: TrackingRow[];
    totalRevenue: number;
    paymentCount: number;
    chartData: Array<{ month: string; amount: number }>;
  };
}

export default function PaymentTracking({ data }: PaymentTrackingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const currentMonthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const filteredRows = useMemo(() => {
    return data.reportRows.filter((row) =>
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const stats = useMemo(() => {
    const paid = data.reportRows.filter((r) => r.paidThisMonth).length;
    const totalMonthlyExpected = data.reportRows.reduce((acc, row) => acc + Number(row.monthlyFee || 0), 0);
    const totalMonthlyCollected = data.reportRows
      .filter((r) => r.paidThisMonth)
      .reduce((acc, row) => acc + Number(row.monthlyFee || 0), 0);

    return {
      paid,
      pending: data.reportRows.length - paid,
      percent: data.reportRows.length > 0 ? Math.round((paid / data.reportRows.length) * 100) : 0,
      totalMonthlyExpected,
      totalMonthlyCollected,
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Payment Tracking</h1>
        <p className="text-muted-foreground">
          Monthly dues status for <span className="font-semibold text-foreground">{currentMonthName}</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reportRows.length}</div>
            <p className="text-xs text-muted-foreground">Included in tracking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">Players up to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Players pending payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percent}%</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalMonthlyCollected.toLocaleString()} of ${stats.totalMonthlyExpected.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly evolution of received payments.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <DashboardFinanceChart chartData={data.chartData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
              Tracking Summary
            </CardTitle>
            <CardDescription>Global payment snapshot across all players.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="text-xs text-muted-foreground">Total Revenue</div>
              <div className="text-xl font-bold">${data.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="text-xs text-muted-foreground">Payments Recorded</div>
              <div className="text-xl font-bold">{data.paymentCount}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="text-xs text-muted-foreground">Current Month Status</div>
              <div className="text-sm font-semibold">
                {stats.paid} paid / {stats.pending} pending
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-96">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search player or category..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">Showing {filteredRows.length} players</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium text-center">Monthly Fee</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Last Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-[11px] text-muted-foreground">ID: {row.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-4 py-4">{row.category}</td>
                      <td className="px-4 py-4 text-center font-bold">${row.monthlyFee.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">
                        {row.paidThisMonth ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle2Icon className="mr-1 h-3 w-3" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertCircleIcon className="mr-1 h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{row.lastPayment}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

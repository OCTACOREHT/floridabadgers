import { BanknoteIcon, CreditCardIcon, TrendingUpIcon, WalletIcon } from "lucide-react";
import { DashboardFinanceChart } from "./finance-chart";
import { DashboardFinanceData } from "@/lib/dashboard/data";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FinanceDashboardProps {
  data: DashboardFinanceData;
}

export default function FinanceDashboard({ data }: FinanceDashboardProps) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Track revenue for the Junior program (Registrations and monthly fees).
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Month)</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalRevenueMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.revenueTrendPct > 0 ? "+" : ""}{data.revenueTrendPct}% compared to last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.registrationRevenueMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Entry fees ($150)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Fees</CardTitle>
            <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.monthlyRevenueMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly dues ($50)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.revenueTrendPct}%</div>
            <p className="text-xs text-muted-foreground">Revenue evolution</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly evolution of received payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <DashboardFinanceChart chartData={data.chartData} />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest recorded payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No recent payments.</p>
              ) : (
                data.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
                      <BanknoteIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{payment.joueur_nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.type} • {payment.methode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">+${payment.montant}</p>
                      <p className="text-[10px] text-muted-foreground">{payment.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

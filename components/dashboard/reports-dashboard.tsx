"use client";

import { DownloadIcon, SearchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

interface ReportRow {
  id: string;
  name: string;
  category: string;
  dossard: number | null;
  totalPaid: number;
  lastPayment: string;
  paymentCount: number;
}

interface ReportsDashboardProps {
  data: {
    reportRows: ReportRow[];
    totalRevenue: number;
    paymentCount: number;
  };
}

export default function ReportsDashboard({ data }: ReportsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = useMemo(() => {
    return data.reportRows.filter(row => 
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.reportRows, searchTerm]);

  const exportToCsv = () => {
    const escapeCsv = (value: string | number) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const headers = [
      "Player Name",
      "Category",
      "Jersey #",
      "Total Paid ($)",
      "Last Payment Date",
      "Number of Payments",
    ];

    const lines = [
      headers.join(","),
      ...filteredRows.map((row) =>
        [
          row.name,
          row.category,
          row.dossard ?? "N/A",
          row.totalPaid,
          row.lastPayment,
          row.paymentCount,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const csvContent = `\uFEFF${lines.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Florida_Badgers_Finance_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Summary of player payments and financial standing.
          </p>
        </div>
        <Button onClick={exportToCsv} className="shrink-0 shadow-sm">
          <DownloadIcon className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.paymentCount}</div>
            <p className="text-xs text-muted-foreground">Recorded transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reportRows.length}</div>
            <p className="text-xs text-muted-foreground">Players in system</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-96">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by player or category..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredRows.length} players
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Total Paid</th>
                  <th className="px-4 py-3 font-medium">Last Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
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
                      <td className="px-4 py-4 font-medium">{row.name}</td>
                      <td className="px-4 py-4">{row.category}</td>
                      <td className="px-4 py-4 font-bold">${row.totalPaid.toLocaleString()}</td>
                      <td className="px-4 py-4 text-muted-foreground">{row.lastPayment}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.totalPaid >= 150 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {row.totalPaid >= 150 ? "Registered" : "Partial"}
                        </span>
                      </td>
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

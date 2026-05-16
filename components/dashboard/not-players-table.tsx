"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon, SearchIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader } from "@/components/ui/table";

export type NotAcceptedRow = {
  source: "Junior" | "Tryout";
  id: string;
  registrationId: string;
  fullName: string;
  age: string;
  email: string;
  phone: string;
  createdAtRaw: string;
  createdAt: string;
};

function normalizeForSearch(value: string): string {
  return value.toLowerCase().trim();
}

export function NotPlayersTable({ rows }: { rows: NotAcceptedRow[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredRows = useMemo(() => {
    const query = normalizeForSearch(searchTerm);
    if (!query) return rows;

    return rows.filter((row) =>
      [
        row.source,
        row.registrationId,
        row.fullName,
        row.age,
        row.email,
        row.phone,
        row.createdAt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [rows, searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    // Keep a tiny delay so the UI spinner is visible and avoids flicker.
    window.setTimeout(() => setIsRefreshing(false), 250);
  };

  return (
    <Card className="border-border/70 bg-card shadow-sm overflow-hidden">
      <CardHeader className="py-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search not accepted players..."
              aria-label="Search not accepted players"
              className="h-10 pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden text-sm text-muted-foreground md:block">
              {filteredRows.length} / {rows.length} records
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCwIcon className={`mr-1.5 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Registration ID</th>
              <th className="px-4 py-3 text-left font-medium">Full Name</th>
              <th className="px-4 py-3 text-left font-medium">Age</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-medium">Created At</th>
            </tr>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <tr>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground italic"
                >
                  No rows found.
                </TableCell>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground italic"
                >
                  No matching rows found.
                </TableCell>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={`${row.source}-${row.id}`} className="border-b hover:bg-muted/30 transition-colors">
                  <TableCell className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-foreground">
                      {row.source}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium">{row.registrationId}</TableCell>
                  <TableCell className="px-4 py-3">{row.fullName}</TableCell>
                  <TableCell className="px-4 py-3">{row.age}</TableCell>
                  <TableCell className="px-4 py-3">{row.email}</TableCell>
                  <TableCell className="px-4 py-3">{row.phone}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">{row.createdAt}</TableCell>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

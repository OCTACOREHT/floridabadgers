import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardTableNames, getDashboardTableConfig } from "@/lib/dashboard/tables";

export const dynamic = "force-dynamic";

export default function DashboardTablesPage() {
  const tableNames = getDashboardTableNames();

  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Table Management</h1>
        <p className="text-sm text-muted-foreground">
          Open any table below to create, view, and delete rows.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tableNames.map((name) => {
          const config = getDashboardTableConfig(name);
          if (!config) return null;
          return (
            <Link key={name} href={`/dashboard/tables/${name}`}>
              <Card className="h-full transition hover:ring-2 hover:ring-primary/30">
                <CardHeader>
                  <CardTitle>{config.label}</CardTitle>
                  <CardDescription>{config.table}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {config.description}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


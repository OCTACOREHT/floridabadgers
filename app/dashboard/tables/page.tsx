import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardTableNames, getDashboardTableConfig } from "@/lib/dashboard/tables";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import {
  canAccessDashboardTable,
  normalizeDashboardRole,
} from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardTablesPage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const role = normalizeDashboardRole(user?.role);
  const isAdmin = role === "admin";

  const allTableNames = getDashboardTableNames();
  const tableNames = allTableNames.filter((name) => canAccessDashboardTable(role, name));

  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">System Data Management</h1>
        <p className="text-sm text-muted-foreground">
          Access and manage authorized database records.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tableNames.map((name) => {
          const config = getDashboardTableConfig(name);
          if (!config) return null;
          
          // Rename Users to Account for non-admins
          const displayLabel = (name === "users" && !isAdmin) ? "My Account" : config.label;
          const displayDescription = (name === "users" && !isAdmin) ? "View and manage your account details" : config.description;

          return (
            <Link key={name} href={`/dashboard/tables/${name}`}>
              <Card className="h-full transition hover:ring-2 hover:ring-primary/30">
                <CardHeader>
                  <CardTitle>{displayLabel}</CardTitle>
                  <CardDescription>{config.table}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {displayDescription}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

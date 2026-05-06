import { notFound } from "next/navigation";

import { DashboardTableManager } from "@/components/dashboard/table-manager";
import { getDashboardTableConfig, getDashboardTableRows } from "@/lib/dashboard/tables";

export const dynamic = "force-dynamic";

export default async function DashboardTablePage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    notFound();
  }

  const initialRows = await getDashboardTableRows(table, 120);

  return <DashboardTableManager key={config.table} config={config} initialRows={initialRows} />;
}

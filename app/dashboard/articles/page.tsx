import { DashboardTableManager } from "@/components/dashboard/table-manager";
import { getDashboardTableConfig, getDashboardTableRows } from "@/lib/dashboard/tables";

export const dynamic = "force-dynamic";

export default async function DashboardArticlesPage() {
  const config = getDashboardTableConfig("actualites");
  if (!config) {
    throw new Error("Articles table configuration is missing.");
  }

  const initialRows = await getDashboardTableRows(config.table, 120);

  return <DashboardTableManager key={config.table} config={config} initialRows={initialRows} />;
}

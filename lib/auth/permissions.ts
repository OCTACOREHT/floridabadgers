export type DashboardRole = "admin" | "finance" | "media";

export const DASHBOARD_TABLES_FOR_FINANCE = ["paiements", "users"] as const;
export const DASHBOARD_TABLES_FOR_MEDIA = ["actualites", "hero_slides", "contact_messages"] as const;

const FINANCE_TABLE_SET = new Set<string>(DASHBOARD_TABLES_FOR_FINANCE);
const MEDIA_TABLE_SET = new Set<string>(DASHBOARD_TABLES_FOR_MEDIA);

export function normalizeDashboardRole(value: unknown): DashboardRole | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "finance") return "finance";
  if (normalized === "media") return "media";
  return null;
}

export function canAccessDashboardTable(role: DashboardRole | null, table: string): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (role === "finance") return FINANCE_TABLE_SET.has(table);
  return MEDIA_TABLE_SET.has(table);
}

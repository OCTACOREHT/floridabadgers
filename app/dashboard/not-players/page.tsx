import { redirect } from "next/navigation";

import {
  getDashboardRegistrationRowsByStatut,
} from "@/lib/dashboard/tables";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { normalizeDashboardRole } from "@/lib/auth/permissions";
import { NotPlayersTable, type NotAcceptedRow } from "@/components/dashboard/not-players-table";

export const dynamic = "force-dynamic";

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toRegistrationId(row: Record<string, unknown>): string {
  const explicit = asText(row.registration_id);
  if (explicit) return explicit;
  const rawId = asText(row.id).replaceAll("-", "");
  return rawId ? `FBCA-${rawId.slice(0, 8).toUpperCase()}` : "-";
}

function toDateLabel(value: unknown): string {
  const raw = asText(value);
  if (!raw) return "-";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapRows(rows: Record<string, unknown>[], source: "Junior" | "Tryout"): NotAcceptedRow[] {
  return rows.map((row) => ({
    createdAtRaw: asText(row.created_at),
    source,
    id: asText(row.id),
    registrationId: toRegistrationId(row),
    fullName: asText(row.nom_complet) || "-",
    age:
      typeof row.age === "number" && Number.isFinite(row.age)
        ? String(row.age)
        : asText(row.age) || "-",
    email: asText(row.email) || "-",
    phone: asText(row.telephone) || "-",
    createdAt: toDateLabel(row.created_at),
  }));
}

export default async function DashboardNotPlayersPage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const role = normalizeDashboardRole(user?.role);
  if (role !== "admin") {
    redirect("/dashboard?error=unauthorized");
  }

  const [juniorRows, stageRows] = await Promise.all([
    getDashboardRegistrationRowsByStatut("inscriptions_joueurs", "refuse", 400),
    getDashboardRegistrationRowsByStatut("inscriptions_stage", "refuse", 400),
  ]);

  const rows = [...mapRows(juniorRows, "Junior"), ...mapRows(stageRows, "Tryout")].sort((a, b) => {
    const aTs = Date.parse(a.createdAtRaw || "");
    const bTs = Date.parse(b.createdAtRaw || "");
    const safeA = Number.isFinite(aTs) ? aTs : 0;
    const safeB = Number.isFinite(bTs) ? bTs : 0;
    return safeB - safeA;
  });

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Not Players</h1>
        <p className="text-sm text-muted-foreground">
          Only not accepted registrations (Junior and Tryout).
        </p>
      </div>
      <NotPlayersTable rows={rows} />
    </div>
  );
}

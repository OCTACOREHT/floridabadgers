import { createSupabaseServiceClient } from "@/lib/supabase/server";

type DateRange = {
  currentFromIso: string;
  previousFromIso: string;
};

export type DashboardOverviewData = {
  totalRegistrations: number;
  pendingRegistrations: number;
  activePlayers: number;
  monthlyPageViews: number;
  registrationsTrendPct: number;
  pendingRatioPct: number;
  activePlayersTrendPct: number;
  pageViewsTrendPct: number;
};

export type DashboardChartPoint = {
  date: string;
  visitors: number;
  registrations: number;
};

export type DashboardRegistrationRow = {
  id: string;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
  createdAt: string | null;
  emergencyContact: string;
};

type RegistrationTableRecord = {
  id: string;
  nom_complet: string | null;
  programme_inscription: string | null;
  statut: string | null;
  age: number | null;
  telephone: string | null;
  email: string | null;
  created_at: string | null;
  contact_urgence_nom: string | null;
};

type SiteEventRecord = {
  created_at: string;
  event_type: string;
  event_value: number | null;
};

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  if (typeof error.code === "string" && error.code.toUpperCase().startsWith("PGRST")) {
    const postgrestMessage = (error.message ?? "").toLowerCase();
    if (postgrestMessage.includes("schema cache") || postgrestMessage.includes("could not find the table")) {
      return true;
    }
  }
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("could not find the table")
  );
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getDateRange(days: number): DateRange {
  const now = new Date();
  const currentFrom = new Date(now);
  currentFrom.setDate(currentFrom.getDate() - days);

  const previousFrom = new Date(currentFrom);
  previousFrom.setDate(previousFrom.getDate() - days);

  return {
    currentFromIso: currentFrom.toISOString(),
    previousFromIso: previousFrom.toISOString(),
  };
}

function computeTrend(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

async function countRows(
  table: "inscriptions_joueurs" | "inscriptions_stage" | "joueurs" | "actualites",
  options?: {
    from?: string;
    to?: string;
    status?: string;
    published?: boolean;
    active?: boolean;
  }
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  if (options?.from) {
    query = query.gte("created_at", options.from);
  }
  if (options?.to) {
    query = query.lt("created_at", options.to);
  }
  if (options?.status) {
    query = query.eq("statut", options.status);
  }
  if (typeof options?.published === "boolean") {
    query = query.eq("is_published", options.published);
  }
  if (typeof options?.active === "boolean") {
    query = query.eq("is_active", options.active);
  }

  const { count, error } = await query;
  if (error) {
    if (isMissingTableError(error)) {
      return 0;
    }
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function fetchSiteEvents(fromIso: string): Promise<SiteEventRecord[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("site_events")
    .select("created_at, event_type, event_value")
    .gte("created_at", fromIso)
    .in("event_type", ["page_view", "registration_submitted"])
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as SiteEventRecord[];
}

async function fetchRegistrationsCreatedAt(
  table: "inscriptions_joueurs" | "inscriptions_stage",
  fromIso: string
): Promise<string[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(table)
    .select("created_at")
    .gte("created_at", fromIso)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => row.created_at)
    .filter((value): value is string => typeof value === "string");
}

function normalizeProgramme(value: string | null): string {
  if (!value) return "junior_foundation";
  return value;
}

function normalizeStatus(value: string | null): string {
  if (!value) return "en_attente";
  return value;
}

export async function getDashboardOverviewData(): Promise<DashboardOverviewData> {
  const range = getDateRange(30);

  const [
    totalJunior,
    totalStage,
    pendingJunior,
    pendingStage,
    activePlayers,
    pageEvents,
    currentJunior,
    currentStage,
    previousJunior,
    previousStage,
    activeCurrent,
    activePrevious,
  ] = await Promise.all([
    countRows("inscriptions_joueurs"),
    countRows("inscriptions_stage"),
    countRows("inscriptions_joueurs", { status: "en_attente" }),
    countRows("inscriptions_stage", { status: "en_attente" }),
    countRows("joueurs", { active: true }),
    fetchSiteEvents(range.previousFromIso),
    countRows("inscriptions_joueurs", { from: range.currentFromIso }),
    countRows("inscriptions_stage", { from: range.currentFromIso }),
    countRows("inscriptions_joueurs", { from: range.previousFromIso, to: range.currentFromIso }),
    countRows("inscriptions_stage", { from: range.previousFromIso, to: range.currentFromIso }),
    countRows("joueurs", { active: true, from: range.currentFromIso }),
    countRows("joueurs", { active: true, from: range.previousFromIso, to: range.currentFromIso }),
  ]);

  const totalRegistrations = totalJunior + totalStage;
  const pendingRegistrations = pendingJunior + pendingStage;
  const currentRegistrations = currentJunior + currentStage;
  const previousRegistrations = previousJunior + previousStage;

  let monthlyPageViews = 0;
  let previousMonthlyPageViews = 0;
  for (const event of pageEvents) {
    if (event.event_type !== "page_view") continue;
    const value = event.event_value && event.event_value > 0 ? event.event_value : 1;
    if (event.created_at >= range.currentFromIso) {
      monthlyPageViews += value;
    } else {
      previousMonthlyPageViews += value;
    }
  }

  return {
    totalRegistrations,
    pendingRegistrations,
    activePlayers,
    monthlyPageViews,
    registrationsTrendPct: computeTrend(currentRegistrations, previousRegistrations),
    pendingRatioPct: totalRegistrations > 0 ? Number(((pendingRegistrations / totalRegistrations) * 100).toFixed(1)) : 0,
    activePlayersTrendPct: computeTrend(activeCurrent, activePrevious),
    pageViewsTrendPct: computeTrend(monthlyPageViews, previousMonthlyPageViews),
  };
}

export async function getDashboardChartData(days = 90): Promise<DashboardChartPoint[]> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days + 1);

  const [events, juniorDates, stageDates] = await Promise.all([
    fetchSiteEvents(from.toISOString()),
    fetchRegistrationsCreatedAt("inscriptions_joueurs", from.toISOString()),
    fetchRegistrationsCreatedAt("inscriptions_stage", from.toISOString()),
  ]);

  const visitorsByDay = new Map<string, number>();
  const registrationsByDay = new Map<string, number>();

  for (const event of events) {
    if (event.event_type !== "page_view") continue;
    const day = event.created_at.slice(0, 10);
    const current = visitorsByDay.get(day) ?? 0;
    const eventValue = event.event_value && event.event_value > 0 ? event.event_value : 1;
    visitorsByDay.set(day, current + eventValue);
  }

  for (const createdAt of juniorDates) {
    const day = createdAt.slice(0, 10);
    registrationsByDay.set(day, (registrationsByDay.get(day) ?? 0) + 1);
  }
  for (const createdAt of stageDates) {
    const day = createdAt.slice(0, 10);
    registrationsByDay.set(day, (registrationsByDay.get(day) ?? 0) + 1);
  }

  const points: DashboardChartPoint[] = [];
  const cursor = new Date(from);
  while (cursor <= now) {
    const day = toIsoDate(cursor);
    points.push({
      date: day,
      visitors: visitorsByDay.get(day) ?? 0,
      registrations: registrationsByDay.get(day) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

async function fetchRegistrationRowsFromTable(
  table: "inscriptions_joueurs" | "inscriptions_stage",
  limit: number
): Promise<DashboardRegistrationRow[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(table)
    .select(
      "id, nom_complet, programme_inscription, statut, age, telephone, email, created_at, contact_urgence_nom"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  const tableLabel = table === "inscriptions_stage" ? "stage" : "junior";
  return ((data ?? []) as RegistrationTableRecord[]).map((row) => ({
    id: `${tableLabel}:${row.id}`,
    header: row.nom_complet?.trim() || "Sans nom",
    type: normalizeProgramme(row.programme_inscription),
    status: normalizeStatus(row.statut),
    target: row.age ? String(row.age) : "-",
    limit: row.telephone?.trim() || "-",
    reviewer: row.email?.trim() || "-",
    createdAt: row.created_at,
    emergencyContact: row.contact_urgence_nom?.trim() || "-",
  }));
}

export async function getDashboardRegistrationRows(limit = 80): Promise<DashboardRegistrationRow[]> {
  const normalizedLimit = Math.max(10, Math.min(limit, 300));
  const [juniorRows, stageRows] = await Promise.all([
    fetchRegistrationRowsFromTable("inscriptions_joueurs", normalizedLimit),
    fetchRegistrationRowsFromTable("inscriptions_stage", normalizedLimit),
  ]);

  return [...juniorRows, ...stageRows]
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, normalizedLimit);
}

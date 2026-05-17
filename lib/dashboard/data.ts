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

export type DashboardAnalyticsBrowser = "chrome" | "safari" | "firefox" | "edge" | "other";

export type DashboardAnalyticsData = {
  monthlyTraffic: Array<{
    month: string;
    visitors: number;
    registrations: number;
  }>;
  browserShare: Array<{
    browser: DashboardAnalyticsBrowser;
    visitors: number;
    fill: string;
  }>;
  topArticles: Array<{
    article: string;
    visitors: number;
    fill: string;
  }>;
  countryShare: Array<{
    country: string;
    visitors: number;
    fill: string;
  }>;
  topPages: Array<{
    page: string;
    visitors: number;
  }>;
  recentTraffic: Array<{
    date: string;
    pageViews: number;
    articleViews: number;
  }>;
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

type SiteEventDetailedRecord = {
  created_at: string;
  event_type: string;
  event_value: number | null;
  path: string | null;
  metadata: unknown;
};

type ArticleTitleRecord = {
  id: string;
  titre: string | null;
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

function toPositiveCount(value: number | null): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return 1;
}

function getMetadataObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function extractArticleIdFromPath(path: string | null): string | null {
  if (!path) return null;
  const match = path.match(/^\/news\/article\/([^/?#]+)$/i);
  return match?.[1] ?? null;
}

function extractArticleIdFromMetadata(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const raw = metadata.articleId ?? metadata.article_id;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function detectBrowser(metadata: Record<string, unknown> | null): DashboardAnalyticsBrowser {
  const userAgent = typeof metadata?.userAgent === "string" ? metadata.userAgent.toLowerCase() : "";

  if (!userAgent) return "other";
  if (userAgent.includes("edg/")) return "edge";
  if (userAgent.includes("firefox/")) return "firefox";
  if (userAgent.includes("safari/") && !userAgent.includes("chrome/")) return "safari";
  if (userAgent.includes("chrome/")) return "chrome";
  return "other";
}

function countryNameFromCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (normalized === "HT") return "Haiti";
  if (normalized === "US") return "United States";
  if (normalized === "CA") return "Canada";
  if (normalized === "FR") return "France";
  if (normalized === "DO") return "Dominican Republic";
  if (normalized === "BR") return "Brazil";
  if (normalized === "MX") return "Mexico";
  return normalized;
}

function countryFromTimezone(timezone: string | null): string | null {
  if (!timezone) return null;
  const trimmed = timezone.trim();
  if (!trimmed) return null;

  if (trimmed === "America/Port-au-Prince") return "Haiti";
  if (trimmed.startsWith("US/")) return "United States";

  const US_TIMEZONES = [
    "America/New_York",
    "America/Detroit",
    "America/Chicago",
    "America/Denver",
    "America/Phoenix",
    "America/Los_Angeles",
    "America/Anchorage",
    "Pacific/Honolulu",
  ];

  if (US_TIMEZONES.includes(trimmed)) return "United States";
  return null;
}

function detectCountry(metadata: Record<string, unknown> | null): string | null {
  const country = typeof metadata?.country === "string" ? metadata.country.trim() : "";
  if (country) {
    if (country.length <= 3 && /^[A-Za-z]+$/.test(country)) {
      return countryNameFromCode(country);
    }
    return country;
  }

  const countryCode = typeof metadata?.countryCode === "string" ? metadata.countryCode.trim() : "";
  if (countryCode) {
    return countryNameFromCode(countryCode);
  }

  const timezone = typeof metadata?.timezone === "string" ? metadata.timezone : null;
  return countryFromTimezone(timezone);
}

function normalizeTrackedPath(path: string | null): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return null;
  const [withoutQuery] = trimmed.split("?");
  const [normalized] = withoutQuery.split("#");
  return normalized || null;
}

function formatTrackedPathLabel(path: string): string {
  if (path === "/") return "Home (/)";
  if (path === "/news") return "News (/news)";
  if (path.startsWith("/news/article/")) {
    const articleId = path.replace("/news/article/", "").split("/")[0] ?? "";
    const shortId = articleId.slice(0, 8);
    return shortId ? `Article ${shortId}` : "/news/article/*";
  }
  if (path.length > 40) return `${path.slice(0, 37)}...`;
  return path;
}

function shiftMonths(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function monthKeyFromDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const asDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return asDate.toLocaleDateString("en-US", { month: "short" });
}

function normalizeArticleTitle(raw: string | null, id: string): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return `Article ${id.slice(0, 8)}`;
  }
  return trimmed.length > 32 ? `${trimmed.slice(0, 29)}...` : trimmed;
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

async function fetchPageViewEventsDetailed(fromIso: string): Promise<SiteEventDetailedRecord[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("site_events")
    .select("created_at, event_type, event_value, path, metadata")
    .gte("created_at", fromIso)
    .eq("event_type", "page_view")
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []) as SiteEventDetailedRecord[];
}

async function fetchArticleTitles(limit = 240): Promise<Map<string, string>> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("actualites")
    .select("id, titre")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 1000)));

  if (error) {
    if (isMissingTableError(error)) {
      return new Map();
    }
    throw new Error(error.message);
  }

  const titleMap = new Map<string, string>();
  for (const row of (data ?? []) as ArticleTitleRecord[]) {
    const articleId = row.id.trim();
    if (!articleId) continue;
    titleMap.set(articleId, normalizeArticleTitle(row.titre, articleId));
  }
  return titleMap;
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

export async function getDashboardAnalyticsData(): Promise<DashboardAnalyticsData> {
  const fallback: DashboardAnalyticsData = {
    monthlyTraffic: [],
    browserShare: [
      { browser: "chrome", visitors: 0, fill: "var(--color-chrome)" },
      { browser: "safari", visitors: 0, fill: "var(--color-safari)" },
      { browser: "firefox", visitors: 0, fill: "var(--color-firefox)" },
      { browser: "edge", visitors: 0, fill: "var(--color-edge)" },
      { browser: "other", visitors: 0, fill: "var(--color-other)" },
    ],
    topArticles: [],
    countryShare: [],
    topPages: [],
    recentTraffic: [],
  };

  try {
    const now = new Date();
    const monthlyStart = shiftMonths(now, -5);
    const recentStart = new Date(now);
    recentStart.setDate(recentStart.getDate() - 13);

    const fromIso = monthlyStart.toISOString();
    const recentFromIso = toIsoDate(recentStart);

    const [pageEvents, juniorDates, stageDates, articleTitles] = await Promise.all([
      fetchPageViewEventsDetailed(fromIso),
      fetchRegistrationsCreatedAt("inscriptions_joueurs", fromIso),
      fetchRegistrationsCreatedAt("inscriptions_stage", fromIso),
      fetchArticleTitles(),
    ]);

    const monthlyKeys: string[] = [];
    const monthlyVisitors = new Map<string, number>();
    const monthlyRegistrations = new Map<string, number>();
    for (let monthOffset = 0; monthOffset < 6; monthOffset += 1) {
      const monthKey = monthKeyFromDate(shiftMonths(monthlyStart, monthOffset));
      monthlyKeys.push(monthKey);
      monthlyVisitors.set(monthKey, 0);
      monthlyRegistrations.set(monthKey, 0);
    }

    const browserCounts: Record<DashboardAnalyticsBrowser, number> = {
      chrome: 0,
      safari: 0,
      firefox: 0,
      edge: 0,
      other: 0,
    };

    const articleViewsById = new Map<string, number>();
    const countryViews = new Map<string, number>();
    const pageViewsByPath = new Map<string, number>();
    const recentPageViews = new Map<string, number>();
    const recentArticleViews = new Map<string, number>();

    for (const event of pageEvents) {
      const count = toPositiveCount(event.event_value);
      const day = event.created_at.slice(0, 10);
      const monthKey = event.created_at.slice(0, 7);

      if (monthlyVisitors.has(monthKey)) {
        monthlyVisitors.set(monthKey, (monthlyVisitors.get(monthKey) ?? 0) + count);
      }

      if (day >= recentFromIso) {
        recentPageViews.set(day, (recentPageViews.get(day) ?? 0) + count);
      }

      const metadata = getMetadataObject(event.metadata);
      const browser = detectBrowser(metadata);
      browserCounts[browser] += count;

      const country = detectCountry(metadata);
      if (country) {
        countryViews.set(country, (countryViews.get(country) ?? 0) + count);
      }

      const normalizedPath = normalizeTrackedPath(event.path);
      if (normalizedPath) {
        pageViewsByPath.set(normalizedPath, (pageViewsByPath.get(normalizedPath) ?? 0) + count);
      }

      const articleId = extractArticleIdFromMetadata(metadata) ?? extractArticleIdFromPath(event.path);
      if (!articleId) continue;

      articleViewsById.set(articleId, (articleViewsById.get(articleId) ?? 0) + count);
      if (day >= recentFromIso) {
        recentArticleViews.set(day, (recentArticleViews.get(day) ?? 0) + count);
      }
    }

    for (const createdAt of [...juniorDates, ...stageDates]) {
      const monthKey = createdAt.slice(0, 7);
      if (!monthlyRegistrations.has(monthKey)) continue;
      monthlyRegistrations.set(monthKey, (monthlyRegistrations.get(monthKey) ?? 0) + 1);
    }

    const monthlyTraffic = monthlyKeys.map((monthKey) => ({
      month: monthLabelFromKey(monthKey),
      visitors: monthlyVisitors.get(monthKey) ?? 0,
      registrations: monthlyRegistrations.get(monthKey) ?? 0,
    }));

    const browserShare: DashboardAnalyticsData["browserShare"] = [
      { browser: "chrome", visitors: browserCounts.chrome, fill: "var(--color-chrome)" },
      { browser: "safari", visitors: browserCounts.safari, fill: "var(--color-safari)" },
      { browser: "firefox", visitors: browserCounts.firefox, fill: "var(--color-firefox)" },
      { browser: "edge", visitors: browserCounts.edge, fill: "var(--color-edge)" },
      { browser: "other", visitors: browserCounts.other, fill: "var(--color-other)" },
    ];

    const topArticles = Array.from(articleViewsById.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([articleId, visitors], index) => ({
        article: articleTitles.get(articleId) ?? normalizeArticleTitle(null, articleId),
        visitors,
        fill: `var(--chart-${(index % 5) + 1})`,
      }));

    const countryShare = Array.from(countryViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([country, visitors], index) => ({
        country,
        visitors,
        fill: `var(--chart-${(index % 5) + 1})`,
      }));

    const topPages = Array.from(pageViewsByPath.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([page, visitors]) => ({
        page: formatTrackedPathLabel(page),
        visitors,
      }));

    const recentTraffic: DashboardAnalyticsData["recentTraffic"] = [];
    const cursor = new Date(recentStart);
    while (cursor <= now) {
      const day = toIsoDate(cursor);
      recentTraffic.push({
        date: day,
        pageViews: recentPageViews.get(day) ?? 0,
        articleViews: recentArticleViews.get(day) ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      monthlyTraffic,
      browserShare,
      topArticles,
      countryShare,
      topPages,
      recentTraffic,
    };
  } catch {
    return fallback;
  }
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
export type DashboardFinanceData = {
  totalRevenueMonth: number;
  registrationRevenueMonth: number;
  monthlyRevenueMonth: number;
  revenueTrendPct: number;
  chartData: Array<{ month: string; amount: number }>;
  recentPayments: Array<{
    id: string;
    joueur_nom: string;
    montant: number;
    type: string;
    methode: string;
    date: string;
  }>;
};

export async function getDashboardFinanceData(): Promise<DashboardFinanceData> {
  const supabase = createSupabaseServiceClient();
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const prevMonthStart = shiftMonths(now, -1).toISOString();

  const [currentPayments, prevPayments, recentRaw] = await Promise.all([
    supabase.from("paiements").select("*").gte("date_paiement", currentMonthStart),
    supabase.from("paiements").select("*").gte("date_paiement", prevMonthStart).lt("date_paiement", currentMonthStart),
    supabase.from("paiements")
      .select("*, joueurs(prenom, nom)")
      .order("date_paiement", { ascending: false })
      .limit(5)
  ]);

  const currentData = currentPayments.data || [];
  const prevData = prevPayments.data || [];
  
  const totalRevenueMonth = currentData.reduce((acc, p) => acc + Number(p.montant), 0);
  const prevRevenueMonth = prevData.reduce((acc, p) => acc + Number(p.montant), 0);
  
  const registrationRevenueMonth = currentData
    .filter(p => p.type_frais === "registration")
    .reduce((acc, p) => acc + Number(p.montant), 0);
    
  const monthlyRevenueMonth = currentData
    .filter(p => p.type_frais === "monthly")
    .reduce((acc, p) => acc + Number(p.montant), 0);

  // 1. Get current local month and year to avoid UTC offsets shifting the month
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // 2. Calculate the start date for the 6-month window (exactly 5 months ago from the 1st of this month)
  const startDate = new Date(currentYear, currentMonth - 5, 1);
  const rangeStart = startDate.toISOString().split('T')[0]; // Use YYYY-MM-DD for consistency

  // 3. Fetch all payments in that range
  const { data: allRangePayments } = await supabase
    .from("paiements")
    .select("montant, date_paiement")
    .gte("date_paiement", rangeStart)
    .order("date_paiement", { ascending: true });

  // 4. Generate the 6 month slots ending with the current month
  const chartBuckets: Array<{ month: string; amount: number; key: string }> = [];
  const monthlyBuckets: Record<string, number> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    
    chartBuckets.push({ month: label, amount: 0, key });
    monthlyBuckets[key] = 0;
  }

  // 5. Fill buckets using local date parsing to match the generated keys
  (allRangePayments || []).forEach(p => {
    if (!p.date_paiement) return;
    const pDate = new Date(p.date_paiement);
    // Important: use getMonth/getFullYear to stay in local context
    const pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyBuckets[pKey] !== undefined) {
      monthlyBuckets[pKey] += Number(p.montant);
    }
  });

  // 6. Finalize chartData in the public shape expected by DashboardFinanceData
  const chartData = chartBuckets.map((item) => ({
    month: item.month,
    amount: monthlyBuckets[item.key] || 0,
  }));

  const recentPayments = (recentRaw.data || []).map(p => ({
    id: p.id,
    joueur_nom: p.joueurs ? `${p.joueurs.prenom} ${p.joueurs.nom}` : "Unknown Player",
    montant: Number(p.montant),
    type: p.type_frais,
    methode: p.methode_paiement,
    date: p.date_paiement
  }));

  return {
    totalRevenueMonth,
    registrationRevenueMonth,
    monthlyRevenueMonth,
    revenueTrendPct: computeTrend(totalRevenueMonth, prevRevenueMonth),
    chartData,
    recentPayments
  };
}
export async function getReportsData() {
  const supabase = createSupabaseServiceClient();
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 1. Get all players with their category
  const { data: players, error: playersError } = await supabase
    .from("joueurs")
    .select(`
      id,
      prenom,
      nom,
      dossard,
      sexe,
      poste,
      niveau,
      is_active,
      categorie:categorie_id ( nom )
    `)
    .order("nom", { ascending: true });

  if (playersError) throw new Error(playersError.message);

  // 2. Get all payments
  const { data: payments, error: paymentsError } = await supabase
    .from("paiements")
    .select("*")
    .order("date_paiement", { ascending: false });

  if (paymentsError) throw new Error(paymentsError.message);

  // 3. Process data for the report
  const reportRows = (players || []).map(player => {
    const playerPayments = (payments || []).filter(p => p.joueur_id === player.id);
    const totalPaid = playerPayments.reduce((acc, p) => acc + Number(p.montant), 0);
    const lastPayment = playerPayments[0]?.date_paiement || "No payment";
    const categoryRelation = player.categorie;
    const categoryName = (
      categoryRelation &&
      typeof categoryRelation === "object" &&
      !Array.isArray(categoryRelation) &&
      typeof (categoryRelation as { nom?: unknown }).nom === "string"
    )
      ? (categoryRelation as { nom: string }).nom
      : "N/A";
    
    // Check if paid for current month (monthly fee of $50)
    const paidThisMonth = playerPayments.some(p => 
      p.type_frais === "monthly" && 
      new Date(p.date_paiement) >= new Date(currentMonthStart)
    );
    
    return {
      id: player.id,
      name: `${player.prenom} ${player.nom}`,
      category: categoryName,
      dossard: player.dossard,
      totalPaid,
      lastPayment,
      monthlyFee: 50,
      paidThisMonth,
      paymentCount: playerPayments.length,
      payments: playerPayments
    };
  });

  return {
    reportRows,
    totalRevenue: (payments || []).reduce((acc, p) => acc + Number(p.montant), 0),
    paymentCount: (payments || []).length
  };
}

type SportmonksSubscription = {
  plans?: Array<{
    plan?: string;
    sport?: string;
    category?: string;
  }>;
};

type SportmonksResponseMeta = {
  message?: string;
  subscription?: SportmonksSubscription[];
};

type SportmonksListResponse<T> = SportmonksResponseMeta & {
  data?: T[];
  pagination?: {
    has_more?: boolean;
  };
};

type SportmonksSingleResponse<T> = SportmonksResponseMeta & {
  data?: T;
};

type SportmonksTeam = {
  id: number;
  name: string;
  image_path?: string | null;
};

type SportmonksParticipant = {
  id: number;
  name: string;
  image_path?: string | null;
  meta?: {
    location?: string;
  };
};

type SportmonksFixture = {
  id: number;
  starting_at?: string | null;
  name?: string | null;
  result_info?: string | null;
  league?: {
    name?: string | null;
  };
  venue?: {
    name?: string | null;
  };
  state?: {
    name?: string | null;
  };
  participants?: SportmonksParticipant[];
};

type FixtureSide = {
  id: number | null;
  name: string;
  logoUrl: string | null;
};

export type UpslFixture = {
  id: number;
  kickoff: string;
  competition: string;
  venue: string | null;
  status: string | null;
  home: FixtureSide;
  away: FixtureSide;
};

export type UpslFixturesResult = {
  source: "sportmonks" | "upsl-public-fallback";
  season: number;
  fixtures: UpslFixture[];
  error?: string;
  warning?: string;
};

type UpslLivescoreScope = "all" | "inplay" | "latest";

export type UpslLivescore = {
  id: number;
  kickoff: string | null;
  name: string;
  competition: string;
  venue: string | null;
  status: string | null;
  resultInfo: string | null;
  home: FixtureSide;
  away: FixtureSide;
};

export type UpslLivescoresResult = {
  source: "sportmonks";
  scope: UpslLivescoreScope;
  fixtures: UpslLivescore[];
  error?: string;
  message?: string;
};

function toTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function normalizeStatus(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return normalizeName(value);
}

export function isFinishedFixture(fixture: UpslFixture): boolean {
  const normalized = normalizeStatus(fixture.status);
  if (!normalized) {
    return false;
  }

  return (
    normalized.includes("final") ||
    normalized.includes("finished") ||
    normalized.includes("full time") ||
    normalized === "ft" ||
    normalized.includes("after penalties") ||
    normalized.includes("after extra time")
  );
}

export function sortFixturesByKickoffPriority(fixtures: UpslFixture[]): UpslFixture[] {
  return [...fixtures].sort((a, b) => {
    const aFinished = isFinishedFixture(a);
    const bFinished = isFinishedFixture(b);

    if (aFinished !== bFinished) {
      return aFinished ? 1 : -1;
    }

    const aKickoff = toTimestamp(a.kickoff);
    const bKickoff = toTimestamp(b.kickoff);
    if (!Number.isFinite(aKickoff) && !Number.isFinite(bKickoff)) {
      return a.id - b.id;
    }
    if (!Number.isFinite(aKickoff)) {
      return 1;
    }
    if (!Number.isFinite(bKickoff)) {
      return -1;
    }

    if (!aFinished) {
      return aKickoff - bKickoff;
    }

    return bKickoff - aKickoff;
  });
}

const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football";
const DEFAULT_TEAM_NAME = "Florida Badgers FC";
const PLACEHOLDER_TEAM_IDS = new Set<number>([0, 1, 12345, 99999]);
const NO_RESULTS_SNIPPET = "no result";
const SUBSCRIPTION_SNIPPET = "current subscription";
const FALLBACK_COMPETITION = "UPSL - Florida South";
const UPSL_TEAM_LOGOS: Record<string, string> = {
  "Florida Badgers FC": "https://upsl.com/wp-content/uploads/sites/5/2025/08/937646.jpg",
  "Miami United FC": "https://upsl.com/wp-content/uploads/sites/5/2024/01/139893-1.jpg",
  "Miami FC U20": "https://upsl.com/wp-content/uploads/sites/5/2025/08/502435.jpg",
  "Florida Futbol Club": "https://upsl.com/wp-content/uploads/sites/5/2024/08/429439-2.jpg",
  "Florida Wolves FC": "https://upsl.com/wp-content/uploads/sites/5/2025/08/509586.jpg",
  "Inter Miami CF Academy": "https://upsl.com/wp-content/uploads/sites/5/2022/08/262226.jpg",
  "Parkland Soccer Club": "https://upsl.com/wp-content/uploads/sites/5/2023/08/996638.jpg",
  "Palm Beach Flames SC": "https://upsl.com/wp-content/uploads/sites/5/2022/05/084917-3.jpg",
  "Florida Soccer Soldiers": "https://upsl.com/wp-content/uploads/sites/5/2025/09/093367.jpg",
  "Empire SC": "https://upsl.com/wp-content/uploads/sites/5/2026/01/151237.jpg",
  "Plantation FC": "https://upsl.com/wp-content/uploads/sites/5/2023/02/070129-4.jpg",
  "Rush Select Academy": "https://upsl.com/wp-content/uploads/sites/5/2022/08/196428-4.jpg",
  "City Soccer FC": "https://upsl.com/wp-content/uploads/sites/5/2022/05/222657-5.jpg",
  "Elevate Soccer Project ESP Miami": "https://upsl.com/wp-content/uploads/sites/5/2025/08/670860.jpg",
};

type FallbackFixtureRow = {
  home: string;
  away: string;
  date: string; // MM/DD/YYYY
  timePt: string; // h:mm am/pm PT
  venue: string;
  isResult: boolean;
  homeScore?: number;
  awayScore?: number;
};

const FALLBACK_BADGERS_2026: FallbackFixtureRow[] = [
  {
    home: "Miami United FC",
    away: "Florida Badgers FC",
    date: "03/08/2026",
    timePt: "3:00 pm PT",
    venue: "Flamingo West Park",
    isResult: true,
    homeScore: 1,
    awayScore: 2,
  },
  {
    home: "Florida Badgers FC",
    away: "Miami FC U20",
    date: "03/15/2026",
    timePt: "4:00 pm PT",
    venue: "Hester Community Center",
    isResult: true,
    homeScore: 1,
    awayScore: 0,
  },
  {
    home: "Florida Futbol Club",
    away: "Florida Badgers FC",
    date: "03/21/2026",
    timePt: "5:00 pm PT",
    venue: "Monsignor Edward Pace",
    isResult: true,
    homeScore: 2,
    awayScore: 3,
  },
  {
    home: "Florida Badgers FC",
    away: "Florida Wolves FC",
    date: "03/29/2026",
    timePt: "4:00 pm PT",
    venue: "Hester Community Center",
    isResult: true,
    homeScore: 4,
    awayScore: 1,
  },
  {
    home: "Florida Badgers FC",
    away: "Inter Miami CF Academy",
    date: "04/12/2026",
    timePt: "4:00 pm PT",
    venue: "Hester Community Center",
    isResult: true,
    homeScore: 2,
    awayScore: 1,
  },
  {
    home: "Florida Badgers FC",
    away: "Parkland Soccer Club",
    date: "04/19/2026",
    timePt: "4:00 pm PT",
    venue: "Hester Community Center",
    isResult: true,
    homeScore: 3,
    awayScore: 2,
  },
  {
    home: "Palm Beach Flames SC",
    away: "Florida Badgers FC",
    date: "04/25/2026",
    timePt: "5:00 pm PT",
    venue: "Dr. Joaquin Garcia HS",
    isResult: true,
    homeScore: 2,
    awayScore: 4,
  },
  {
    home: "Florida Badgers FC",
    away: "Florida Soccer Soldiers",
    date: "05/03/2026",
    timePt: "4:00 pm PT",
    venue: "Hester Community Center",
    isResult: true,
    homeScore: 2,
    awayScore: 1,
  },
  {
    home: "Empire SC",
    away: "Florida Badgers FC",
    date: "05/10/2026",
    timePt: "4:00 pm PT",
    venue: "UPSL Stadium",
    isResult: false,
  },
  {
    home: "Florida Badgers FC",
    away: "Plantation FC",
    date: "05/17/2026",
    timePt: "4:00 pm PT",
    venue: "Hester Community Center",
    isResult: false,
  },
  {
    home: "Elevate Soccer Project ESP Miami",
    away: "Florida Badgers FC",
    date: "05/24/2026",
    timePt: "12:00 pm PT",
    venue: "Oak Grove Park",
    isResult: false,
  },
  {
    home: "Rush Select Academy",
    away: "Florida Badgers FC",
    date: "05/30/2026",
    timePt: "1:00 pm PT",
    venue: "Sandpiper Bay",
    isResult: false,
  },
  {
    home: "Florida Badgers FC",
    away: "City Soccer FC",
    date: "06/07/2026",
    timePt: "4:00 pm PT",
    venue: "Hester Community Center",
    isResult: false,
  },
];

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

function isValidSeasonYear(value: number): boolean {
  return Number.isInteger(value) && value >= 2020 && value <= 2100;
}

function hasNoResultsMessage(message: string | undefined): boolean {
  return Boolean(message && normalizeName(message).includes(NO_RESULTS_SNIPPET));
}

function hasSubscriptionMessage(message: string | undefined): boolean {
  return Boolean(message && normalizeName(message).includes(SUBSCRIPTION_SNIPPET));
}

function buildCoverageError(teamName: string, seasonYear?: number): string {
  const seasonPart = typeof seasonYear === "number" ? ` for ${seasonYear}` : "";
  return `Sportmonks returned no accessible data for "${teamName}"${seasonPart}. This usually means your current Sportmonks plan does not include this team/league (UPSL).`;
}

async function fetchSportmonksJson<T>(
  path: string,
  token: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const url = new URL(`${SPORTMONKS_BASE_URL}${path}`);
  url.searchParams.set("api_token", token);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Sportmonks request failed (${response.status}): ${details || "Unknown error"}`);
  }

  return (await response.json()) as T;
}

function getSportmonksToken(): string {
  const token = process.env.SPORTMONKS_API_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing SPORTMONKS_API_TOKEN. Add it to your environment variables.");
  }
  return token;
}

async function resolveTeamId(token: string, preferredTeamName: string): Promise<number> {
  const encoded = encodeURIComponent(preferredTeamName);
  const response = await fetchSportmonksJson<SportmonksListResponse<SportmonksTeam>>(
    `/teams/search/${encoded}`,
    token,
    { per_page: 50, page: 1 }
  );

  const teams = response.data ?? [];
  if (!teams.length) {
    if (hasNoResultsMessage(response.message) || hasSubscriptionMessage(response.message)) {
      throw new Error(buildCoverageError(preferredTeamName));
    }
    throw new Error(`No team found for query "${preferredTeamName}".`);
  }

  const normalizedTarget = normalizeName(preferredTeamName);

  const exact = teams.find((team) => normalizeName(team.name) === normalizedTarget);
  if (exact) {
    return exact.id;
  }

  const contains = teams.find((team) => normalizeName(team.name).includes(normalizedTarget));
  if (contains) {
    return contains.id;
  }

  return teams[0].id;
}

async function fetchTeamById(token: string, teamId: number): Promise<SportmonksTeam | null> {
  const response = await fetchSportmonksJson<SportmonksSingleResponse<SportmonksTeam>>(`/teams/${teamId}`, token);

  if (response.data) {
    return response.data;
  }

  if (hasNoResultsMessage(response.message)) {
    return null;
  }

  throw new Error(response.message || `Unable to load team with ID ${teamId} from Sportmonks.`);
}

function startOfYearUtc(year: number): Date {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0));
}

function endOfYearUtc(year: number): Date {
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59));
}

function toYyyyMmDd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildRangesByDays(start: Date, end: Date, days: number): Array<{ start: string; end: string }> {
  const ranges: Array<{ start: string; end: string }> = [];
  let cursor = new Date(start.getTime());

  while (cursor <= end) {
    const rangeStart = new Date(cursor.getTime());
    const rangeEnd = new Date(cursor.getTime());
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + days - 1);
    if (rangeEnd > end) {
      rangeEnd.setTime(end.getTime());
    }

    ranges.push({ start: toYyyyMmDd(rangeStart), end: toYyyyMmDd(rangeEnd) });
    cursor = new Date(rangeEnd.getTime());
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return ranges;
}

async function fetchFixturesForRange(
  token: string,
  teamId: number,
  startDate: string,
  endDate: string
): Promise<SportmonksFixture[]> {
  const fixtures: SportmonksFixture[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchSportmonksJson<SportmonksListResponse<SportmonksFixture>>(
      `/fixtures/between/${startDate}/${endDate}/${teamId}`,
      token,
      {
        include: "participants;league;venue;state",
        per_page: 50,
        page,
      }
    );

    fixtures.push(...(response.data ?? []));
    hasMore = Boolean(response.pagination?.has_more);
    page += 1;
  }

  return fixtures;
}

async function fetchFixturesForSeason(
  token: string,
  teamId: number,
  seasonYear: number
): Promise<UpslFixture[]> {
  const ranges = buildRangesByDays(startOfYearUtc(seasonYear), endOfYearUtc(seasonYear), 90);
  const byId = new Map<number, UpslFixture>();

  for (const range of ranges) {
    const fixtures = await fetchFixturesForRange(token, teamId, range.start, range.end);
    fixtures.forEach((fixture) => {
      const mapped = mapFixture(fixture);
      if (!mapped) {
        return;
      }
      byId.set(mapped.id, mapped);
    });
  }

  const allFixtures = Array.from(byId.values()).sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const upslFixtures = allFixtures.filter((fixture) => isLikelyUpslCompetition(fixture.competition));
  return upslFixtures.length ? upslFixtures : allFixtures;
}

function parseFixtureSide(participants: SportmonksParticipant[] | undefined, location: "home" | "away"): FixtureSide {
  const participant =
    participants?.find((item) => item.meta?.location === location) ??
    participants?.[location === "home" ? 0 : 1];

  return {
    id: participant?.id ?? null,
    name: participant?.name ?? (location === "home" ? "Home Team" : "Away Team"),
    logoUrl: participant?.image_path ?? null,
  };
}

function mapFixture(fixture: SportmonksFixture): UpslFixture | null {
  if (!fixture.starting_at) {
    return null;
  }

  const home = parseFixtureSide(fixture.participants, "home");
  const away = parseFixtureSide(fixture.participants, "away");

  return {
    id: fixture.id,
    kickoff: fixture.starting_at,
    competition: fixture.league?.name?.trim() || "UPSL",
    venue: fixture.venue?.name?.trim() || null,
    status: fixture.state?.name?.trim() || null,
    home,
    away,
  };
}

function mapLivescoreFixture(fixture: SportmonksFixture): UpslLivescore {
  const home = parseFixtureSide(fixture.participants, "home");
  const away = parseFixtureSide(fixture.participants, "away");

  return {
    id: fixture.id,
    kickoff: fixture.starting_at ?? null,
    name: fixture.name?.trim() || `${home.name} vs ${away.name}`,
    competition: fixture.league?.name?.trim() || "UPSL",
    venue: fixture.venue?.name?.trim() || null,
    status: fixture.state?.name?.trim() || null,
    resultInfo: fixture.result_info?.trim() || null,
    home,
    away,
  };
}

function isLikelyUpslCompetition(name: string): boolean {
  const value = normalizeName(name);
  return value.includes("upsl") || value.includes("united premier soccer league");
}

function parseFallbackKickoffIso(date: string, timePt: string): string {
  const [mm, dd, yyyy] = date.split("/");
  const timePart = timePt.replace("PT", "").trim();
  const match = timePart.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);

  if (!mm || !dd || !yyyy || !match) {
    return `${yyyy}-${mm}-${dd}T12:00:00-07:00`;
  }

  let hour = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toLowerCase();

  if (period === "pm" && hour !== 12) {
    hour += 12;
  }
  if (period === "am" && hour === 12) {
    hour = 0;
  }

  const hh = String(hour).padStart(2, "0");
  const month = mm.padStart(2, "0");
  const day = dd.padStart(2, "0");
  return `${yyyy}-${month}-${day}T${hh}:${minutes}:00-07:00`;
}

function buildFallbackBadgers2026Fixtures(): UpslFixture[] {
  return FALLBACK_BADGERS_2026.map((row, index) => ({
    id: 2_026_000 + index,
    kickoff: parseFallbackKickoffIso(row.date, row.timePt),
    competition: FALLBACK_COMPETITION,
    venue: row.venue,
    status: row.isResult
      ? `Final ${row.homeScore ?? 0}-${row.awayScore ?? 0}`
      : "Scheduled",
    home: {
      id: null,
      name: row.home,
      logoUrl: UPSL_TEAM_LOGOS[row.home] ?? null,
    },
    away: {
      id: null,
      name: row.away,
      logoUrl: UPSL_TEAM_LOGOS[row.away] ?? null,
    },
  }));
}

function shouldUseBadgersFallback(seasonYear: number, teamName: string): boolean {
  if (seasonYear !== 2026) {
    return false;
  }

  const normalizedTeam = normalizeName(teamName);
  return (
    normalizedTeam.includes("florida badgers") ||
    normalizedTeam.includes(normalizeName(DEFAULT_TEAM_NAME))
  );
}

function buildBadgersFallbackResult(seasonYear: number, reason?: string): UpslFixturesResult {
  return {
    source: "upsl-public-fallback",
    season: seasonYear,
    fixtures: sortFixturesByKickoffPriority(buildFallbackBadgers2026Fixtures()),
    warning: reason
      ? `${reason} Displaying UPSL public schedule fallback.`
      : "Live Sportmonks data for Florida Badgers was not accessible. Displaying UPSL public schedule fallback.",
  };
}

export async function getUpslFixturesBySeason(season: number): Promise<UpslFixturesResult> {
  const seasonYear = Number.isFinite(season) ? Math.trunc(season) : 2026;
  if (!isValidSeasonYear(seasonYear)) {
    return {
      source: "sportmonks",
      season: 2026,
      fixtures: [],
      error: "Invalid season year. Use a value between 2020 and 2100.",
    };
  }

  const configuredTeamName = process.env.SPORTMONKS_BADGERS_TEAM_NAME?.trim() || DEFAULT_TEAM_NAME;

  let token = "";
  try {
    token = getSportmonksToken();
  } catch (error) {
    if (shouldUseBadgersFallback(seasonYear, configuredTeamName)) {
      return buildBadgersFallbackResult(
        seasonYear,
        error instanceof Error ? error.message : "Missing SPORTMONKS_API_TOKEN."
      );
    }

    return {
      source: "sportmonks",
      season: seasonYear,
      fixtures: [],
      error: error instanceof Error ? error.message : "Missing SPORTMONKS_API_TOKEN.",
    };
  }

  const configuredTeamId = process.env.SPORTMONKS_BADGERS_TEAM_ID?.trim();

  try {
    const hasConfiguredTeamId = Boolean(configuredTeamId && /^\d+$/.test(configuredTeamId));
    const parsedConfiguredTeamId = hasConfiguredTeamId ? Number.parseInt(configuredTeamId!, 10) : null;
    const shouldUseConfiguredId =
      hasConfiguredTeamId && parsedConfiguredTeamId !== null && !PLACEHOLDER_TEAM_IDS.has(parsedConfiguredTeamId);

    let resolvedTeamId: number;
    if (shouldUseConfiguredId) {
      const configuredTeam = await fetchTeamById(token, parsedConfiguredTeamId!);
      resolvedTeamId = configuredTeam ? parsedConfiguredTeamId! : await resolveTeamId(token, configuredTeamName);
    } else {
      resolvedTeamId = await resolveTeamId(token, configuredTeamName);
    }

    let fixtures = await fetchFixturesForSeason(token, resolvedTeamId, seasonYear);

    if (!fixtures.length && shouldUseConfiguredId) {
      const fallbackTeamId = await resolveTeamId(token, configuredTeamName);
      if (fallbackTeamId !== resolvedTeamId) {
        fixtures = await fetchFixturesForSeason(token, fallbackTeamId, seasonYear);
      }
    }

    if (!fixtures.length) {
      if (shouldUseBadgersFallback(seasonYear, configuredTeamName)) {
        return buildBadgersFallbackResult(seasonYear);
      }

      return {
        source: "sportmonks",
        season: seasonYear,
        fixtures: [],
        error: buildCoverageError(configuredTeamName, seasonYear),
      };
    }

    return {
      source: "sportmonks",
      season: seasonYear,
      fixtures: sortFixturesByKickoffPriority(fixtures),
    };
  } catch (error) {
    if (shouldUseBadgersFallback(seasonYear, configuredTeamName)) {
      return buildBadgersFallbackResult(
        seasonYear,
        error instanceof Error ? error.message : "Unable to fetch UPSL fixtures."
      );
    }

    return {
      source: "sportmonks",
      season: seasonYear,
      fixtures: [],
      error: error instanceof Error ? error.message : "Unable to fetch UPSL fixtures.",
    };
  }
}

function toLivescorePath(scope: UpslLivescoreScope): string {
  if (scope === "inplay") {
    return "/livescores/inplay";
  }
  if (scope === "latest") {
    return "/livescores/latest";
  }
  return "/livescores";
}

function normalizeLivescoreData(input: unknown): SportmonksFixture[] {
  if (Array.isArray(input)) {
    return input as SportmonksFixture[];
  }
  if (input && typeof input === "object") {
    return [input as SportmonksFixture];
  }
  return [];
}

function isTeamInFixture(fixture: SportmonksFixture, teamName: string): boolean {
  const target = normalizeName(teamName);
  const fromFixtureName = normalizeName(fixture.name || "");
  if (fromFixtureName.includes(target)) {
    return true;
  }

  const participants = fixture.participants ?? [];
  return participants.some((participant) => normalizeName(participant.name).includes(target));
}

export async function getUpslLivescores(
  scope: UpslLivescoreScope,
  teamName?: string
): Promise<UpslLivescoresResult> {
  try {
    const token = getSportmonksToken();
    const response = await fetchSportmonksJson<SportmonksResponseMeta & { data?: unknown }>(
      toLivescorePath(scope),
      token,
      {
        include: "participants;league;venue;state;scores",
      }
    );

    const allFixtures = normalizeLivescoreData(response.data);
    const filteredFixtures = teamName
      ? allFixtures.filter((fixture) => isTeamInFixture(fixture, teamName))
      : allFixtures;

    return {
      source: "sportmonks",
      scope,
      fixtures: filteredFixtures.map(mapLivescoreFixture),
      message: response.message,
    };
  } catch (error) {
    return {
      source: "sportmonks",
      scope,
      fixtures: [],
      error: error instanceof Error ? error.message : "Unable to fetch Sportmonks livescores.",
    };
  }
}

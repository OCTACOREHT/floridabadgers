import { createSupabaseServiceClient } from "@/lib/supabase/server";

type FieldKind =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "uuid"
  | "select"
  | "password"
  | "json";

export type DashboardTableField = {
  key: string;
  label: string;
  type: FieldKind;
  required?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  options?: string[];
  sensitive?: boolean;
  transient?: boolean;
};

export type DashboardTableConfig = {
  table: string;
  label: string;
  description: string;
  listColumns: string[];
  createFields: DashboardTableField[];
  orderBy?: string;
};

export type RegistrationStatut = "en_attente" | "accepte" | "refuse";

type SiteEventClickRow = {
  path: string | null;
  event_value: number | null;
  metadata: Record<string, unknown> | null;
};
type SiteEventQueryResult = {
  data: SiteEventClickRow[] | null;
  error: { code?: string; message?: string } | null;
};

type RegistrationParentLookupRow = {
  player_id: string | null;
  nom_parent_tuteur: string | null;
  telephone_parent_tuteur: string | null;
  nom_complet: string | null;
  email: string | null;
  telephone: string | null;
  created_at: string | null;
};

const ARTICLE_EVENTS_QUERY_TIMEOUT_MS = 1_200;
const ARTICLE_EVENTS_QUERY_LIMIT = 2_000;
const ARTICLE_CLICKS_CACHE_TTL_MS = 90_000;
const PAYMENT_NAME_LOOKUP_SCAN_LIMIT = 400;
const PAYMENT_NAME_LOOKUP_MAX_CANDIDATES = 80;
const ARTICLE_CLICK_CACHE = new Map<string, { count: number; updatedAt: number }>();

const TABLES_WITH_VIRTUAL_REGISTRATION_ID = new Set([
  "inscriptions_joueurs",
  "inscriptions_stage",
]);

const TABLE_CONFIGS = {
  users: {
    table: "users",
    label: "Account Management",
    description: "Manage system accounts, roles, and access levels",
    listColumns: ["full_name", "email", "role", "created_at"],
    createFields: [
      { key: "full_name", label: "Full Name", type: "text", required: true },
      { key: "email", label: "Email Address", type: "text", required: true },
      { key: "role", label: "Role", type: "select", required: true, options: ["admin", "finance", "media"] },
      { key: "password", label: "Password", type: "password", required: true, transient: true },
      { key: "confirm_password", label: "Confirm Password", type: "password", required: true, transient: true },
      { key: "photo_url", label: "Photo", type: "text", placeholder: "Ajouter une photo" },
    ],
  },
  actualites: {
    table: "actualites",
    label: "Articles",
    description: "News and media articles",
    listColumns: ["titre", "sous_titre", "is_published", "created_at"],
    createFields: [
      { key: "photo_url", label: "Photo", type: "text", placeholder: "Ajouter une photo" },
      { key: "titre", label: "Title", type: "text", required: true },
      { key: "sous_titre", label: "Subtitle", type: "text" },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "is_published", label: "Published", type: "boolean", defaultValue: true },
    ],
  },
  categories: {
    table: "categories",
    label: "Categories",
    description: "Age and program categories",
    listColumns: ["nom", "description", "created_at"],
    createFields: [
      { key: "nom", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  joueurs: {
    table: "joueurs",
    label: "Players",
    description: "Public player roster",
    listColumns: ["prenom", "nom", "dossard", "poste", "niveau", "is_active"],
    createFields: [
      { key: "nom", label: "Last Name", type: "text", required: true },
      { key: "prenom", label: "First Name", type: "text", required: true },
      { key: "photo_url", label: "Photo", type: "text", placeholder: "Ajouter une photo" },
      { key: "date_naissance", label: "Birth Date", type: "date" },
      { key: "age", label: "Age", type: "number" },
      { key: "sexe", label: "Sex", type: "select", options: ["Masculin", "Féminin"] },
      { key: "categorie_id", label: "Category ID", type: "uuid" },
      { key: "poste", label: "Position", type: "select", options: ["Gardien", "Défenseur", "Milieu", "Attaquant"] },
      { key: "niveau", label: "Level", type: "select", options: ["Débutant", "Intermédiaire", "Avancé"] },
      { key: "dossard", label: "Jersey Number", type: "number" },
      { key: "taille", label: "Height", type: "text" },
      { key: "poids", label: "Weight", type: "text" },
      { key: "nationalite", label: "Nationality", type: "text" },
    ],
  },
  inscriptions_joueurs: {
    table: "inscriptions_joueurs",
    label: "Junior Registrations",
    description: "Manage junior program applications",
    listColumns: ["registration_id", "nom_complet", "programme_inscription", "categorie_age", "statut", "created_at"],
    createFields: [
      {
        key: "programme_inscription",
        label: "Program",
        type: "select",
        required: true,
        options: ["junior_foundation", "junior_development", "junior_elite", "stage_english"],
      },
      { key: "nom_complet", label: "Full Name", type: "text", required: true },
      { key: "date_naissance", label: "Birth Date", type: "date", required: true },
      { key: "age", label: "Age", type: "number", required: true },
      { key: "sexe", label: "Sex", type: "select", required: true, options: ["Masculin", "Féminin"] },
      { key: "adresse", label: "Address", type: "text", required: true },
      { key: "telephone", label: "Phone", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "photo_url", label: "Photo", type: "text" },
      { key: "poste_jeu", label: "Position", type: "select", required: true, options: ["Gardien", "Défenseur", "Milieu", "Attaquant"] },
      { key: "niveau_jeu", label: "Level", type: "select", required: true, options: ["Débutant", "Intermédiaire", "Avancé"] },
      { key: "club_actuel", label: "Current Club", type: "text" },
      { key: "experience_football", label: "Football Experience", type: "textarea" },
      { key: "categorie_id", label: "Category ID", type: "uuid", required: true },
      { key: "inscrit_par", label: "Registered By", type: "select", required: true, options: ["parent_tuteur", "joueur"] },
      { key: "relation_avec_joueur", label: "Relation", type: "text" },
      { key: "probleme_sante", label: "Health Issue", type: "boolean" },
      { key: "probleme_sante_details", label: "Health Details", type: "textarea" },
      { key: "allergies_connues", label: "Known Allergies", type: "textarea" },
      { key: "contact_urgence_nom", label: "Emergency Contact Name", type: "text", required: true },
      { key: "contact_urgence_telephone", label: "Emergency Contact Phone", type: "text", required: true },
      { key: "contact_urgence_relation", label: "Relation", type: "text", required: true },
      { key: "contact_urgence_email", label: "Emergency Email", type: "email" },
      { key: "contact_urgence_adresse", label: "Emergency Address", type: "text" },
      { key: "nom_parent_tuteur", label: "Parent/Tutor Name", type: "text" },
      { key: "telephone_parent_tuteur", label: "Parent/Tutor Phone", type: "text" },
      { key: "autorisation_parentale", label: "Parental Authorization", type: "boolean" },
      { key: "consentement_soins_urgence", label: "Emergency Consent", type: "boolean" },
      { key: "accepte_regles_stage", label: "Accepted Rules", type: "boolean" },
      { key: "confirme_infos_correctes", label: "Confirmed Correct Info", type: "boolean" },
      { key: "waiver_accepted", label: "Waiver Accepted", type: "boolean" },
      { key: "signature_nom", label: "Signature Name", type: "text" },
      { key: "signature_date", label: "Signature Date", type: "date" },
      { key: "signature_parent_nom", label: "Parent Signature Name", type: "text" },
      { key: "signature_parent_date", label: "Parent Signature Date", type: "date" },
      { key: "statut", label: "Status", type: "select", options: ["en_attente", "accepte", "refuse"] },
    ],
  },
  inscriptions_stage: {
    table: "inscriptions_stage",
    label: "Stage Registrations",
    description: "Stage (English) registrations",
    listColumns: ["registration_id", "nom_complet", "programme_inscription", "statut", "email", "telephone", "created_at"],
    createFields: [
      { key: "programme_inscription", label: "Program", type: "select", required: true, options: ["stage_english"] },
      { key: "nom_complet", label: "Full Name", type: "text", required: true },
      { key: "date_naissance", label: "Birth Date", type: "date", required: true },
      { key: "age", label: "Age", type: "number", required: true },
      { key: "sexe", label: "Sex", type: "select", required: true, options: ["Masculin", "Feminin"] },
      { key: "adresse", label: "Address", type: "text", required: true },
      { key: "telephone", label: "Phone", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "photo_url", label: "Photo", type: "text", placeholder: "Ajouter une photo" },
      { key: "poste_jeu", label: "Playing Position", type: "select", required: true, options: ["Gardien", "Defenseur", "Milieu", "Attaquant"] },
      { key: "niveau_jeu", label: "Playing Level", type: "select", required: true, options: ["Debutant", "Intermediaire", "Avance"] },
      { key: "club_actuel", label: "Current Club", type: "text" },
      { key: "experience_football", label: "Football Experience", type: "textarea" },
      { key: "categorie_id", label: "Category ID", type: "uuid", required: true },
      { key: "inscrit_par", label: "Registered By", type: "select", required: true, options: ["parent_tuteur", "joueur"] },
      { key: "relation_avec_joueur", label: "Relation With Player", type: "text" },
      { key: "probleme_sante", label: "Health Problem", type: "boolean" },
      { key: "probleme_sante_details", label: "Health Details", type: "textarea" },
      { key: "allergies_connues", label: "Known Allergies", type: "textarea" },
      { key: "contact_urgence_nom", label: "Emergency Contact Name", type: "text", required: true },
      { key: "contact_urgence_telephone", label: "Emergency Contact Phone", type: "text", required: true },
      { key: "contact_urgence_relation", label: "Emergency Contact Relation", type: "text", required: true },
      { key: "contact_urgence_email", label: "Emergency Contact Email", type: "email" },
      { key: "contact_urgence_adresse", label: "Emergency Contact Address", type: "text" },
      { key: "nom_parent_tuteur", label: "Parent/Tutor Name", type: "text" },
      { key: "telephone_parent_tuteur", label: "Parent/Tutor Phone", type: "text" },
      { key: "autorisation_parentale", label: "Parental Authorization", type: "boolean" },
      { key: "consentement_soins_urgence", label: "Emergency Care Consent", type: "boolean" },
      { key: "accepte_regles_stage", label: "Accepted Rules", type: "boolean" },
      { key: "confirme_infos_correctes", label: "Confirmed Correct Info", type: "boolean" },
      { key: "statut", label: "Status", type: "select", options: ["en_attente", "accepte", "refuse"] },
    ],
  },
  contact_messages: {
    table: "contact_messages",
    label: "Contact Messages",
    description: "Messages sent from the website contact form",
    listColumns: ["full_name", "email", "status", "created_at"],
    createFields: [
      { key: "full_name", label: "Full Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "subject", label: "Subject", type: "text", required: true },
      { key: "message", label: "Message", type: "textarea", required: true },
      {
        key: "status",
        label: "Status",
        type: "select",
        defaultValue: "new",
        options: ["new", "in_progress", "replied", "closed"],
      },
      { key: "reply_note", label: "Reply Notes", type: "textarea" },
      { key: "replied_at", label: "Replied At", type: "datetime" },
    ],
  },
  matchs: {
    table: "matchs",
    label: "Matches",
    description: "Scheduled and played matches",
    listColumns: ["equipe_domicile", "equipe_exterieur", "date_match", "statut", "competition", "created_at"],
    createFields: [
      { key: "equipe_domicile", label: "Home Team", type: "text", required: true },
      { key: "logo_domicile_url", label: "Home Logo", type: "text", placeholder: "Ajouter le logo domicile" },
      { key: "equipe_exterieur", label: "Away Team", type: "text", required: true },
      { key: "logo_exterieur_url", label: "Away Logo", type: "text", placeholder: "Ajouter le logo exterieur" },
      { key: "score_domicile", label: "Home Score", type: "number" },
      { key: "score_exterieur", label: "Away Score", type: "number" },
      { key: "date_match", label: "Match Date", type: "datetime", required: true },
      { key: "stade", label: "Stadium", type: "text" },
      { key: "competition", label: "Competition", type: "text" },
      { key: "statut", label: "Status", type: "select", options: ["a_venir", "en_cours", "termine"] },
      { key: "minute_match", label: "Match Minute", type: "number" },
    ],
  },
  hero_slides: {
    table: "hero_slides",
    label: "Hero Carousel",
    description: "Manage homepage hero images and text",
    listColumns: ["titre", "ordre", "is_active", "created_at"],
    createFields: [
      { key: "image_url", label: "Image", type: "text", required: true, placeholder: "Télécharger une photo pour le fond" },
      { key: "titre", label: "Title", type: "text" },
      { key: "sous_titre", label: "Subtitle", type: "textarea" },
      { key: "ordre", label: "Display Order", type: "number", defaultValue: 0 },
      { key: "is_active", label: "Active", type: "boolean", defaultValue: true },
    ],
  },
  paiements: {
    table: "paiements",
    label: "Finance & Payments",
    description: "Manage registration fees ($150) and monthly dues ($50)",
    listColumns: ["joueur_id", "montant", "type_frais", "methode_paiement", "date_paiement", "statut"],
    createFields: [
      { key: "joueur_id", label: "Player", type: "uuid", required: true },
      { key: "montant", label: "Amount ($)", type: "number", required: true, defaultValue: 50 },
      { 
        key: "type_frais", 
        label: "Fee Type", 
        type: "select", 
        required: true, 
        options: ["registration", "monthly", "equipment", "other"] 
      },
      { 
        key: "methode_paiement", 
        label: "Method", 
        type: "select", 
        required: true, 
        options: ["transfer", "zelle", "cash", "card", "check"] 
      },
      { 
        key: "statut", 
        label: "Status", 
        type: "select", 
        required: true, 
        defaultValue: "paid",
        options: ["paid", "pending", "cancelled"] 
      },
      { key: "date_paiement", label: "Payment Date", type: "date", required: true },
      { key: "notes", label: "Notes / Reference", type: "textarea" },
    ],
  },
} satisfies Record<string, DashboardTableConfig>;

export type DashboardTableName = keyof typeof TABLE_CONFIGS;

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

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && !value.trim());
}

function toPositiveCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1;
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
  if (!trimmed) return null;
  return trimmed;
}

function computeRegistrationId(row: Record<string, unknown>): string {
  if (row.registration_id) return String(row.registration_id);

  const nameParts = String(row.nom_complet || "PLAYER").split(/\s+/).filter(Boolean);
  const initials = nameParts.map((part) => part.substring(0, 2).toUpperCase()).join("");
  const idChunk = String(row.id || "").substring(0, 4).toUpperCase();
  return `FBCA-${initials || "PL"}-${idChunk || "0000"}`;
}

function withVirtualColumns(table: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (!TABLES_WITH_VIRTUAL_REGISTRATION_ID.has(table)) {
    return rows;
  }

  return rows.map((row) => ({
    ...row,
    registration_id: computeRegistrationId(row),
  }));
}

function normalizeLookupName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function chunkValues<T>(values: T[], size: number): T[][] {
  if (size <= 0) return [values];
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function resolveWithinTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result as T | null;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function readCachedArticleClicks(articleId: string): number {
  const cached = ARTICLE_CLICK_CACHE.get(articleId);
  if (!cached) return 0;

  if (Date.now() - cached.updatedAt > ARTICLE_CLICKS_CACHE_TTL_MS) {
    ARTICLE_CLICK_CACHE.delete(articleId);
    return 0;
  }

  return cached.count;
}

function buildArticleRowsWithClicksFromMap(
  rows: Record<string, unknown>[],
  clickMap: Map<string, number>
): Record<string, unknown>[] {
  return rows.map((row) => {
    const rowId = typeof row.id === "string" ? row.id : "";
    const clickCount = rowId
      ? (clickMap.has(rowId) ? clickMap.get(rowId) ?? 0 : readCachedArticleClicks(rowId))
      : 0;
    return {
      ...row,
      clicks_count: clickCount,
    };
  });
}

function buildArticleRowsWithCachedClicks(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const rowId = typeof row.id === "string" ? row.id : "";
    return {
      ...row,
      clicks_count: rowId ? readCachedArticleClicks(rowId) : 0,
    };
  });
}

function getPaymentRowPlayerFullName(row: Record<string, unknown>): string | null {
  const relation = row.joueurs;
  const source =
    Array.isArray(relation) ? relation.find((item) => item && typeof item === "object") : relation;

  if (!source || typeof source !== "object") return null;

  const prenom = typeof (source as Record<string, unknown>).prenom === "string"
    ? ((source as Record<string, unknown>).prenom as string).trim()
    : "";
  const nom = typeof (source as Record<string, unknown>).nom === "string"
    ? ((source as Record<string, unknown>).nom as string).trim()
    : "";
  const fullName = `${prenom} ${nom}`.trim();

  return fullName.length > 0 ? fullName : null;
}

export async function enrichPaymentRowsWithRegistrationDetails(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  rows: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  if (rows.length === 0) return rows;

  const playerIds = Array.from(
    new Set(
      rows
        .map((row) => row.joueur_id)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    )
  );

  if (playerIds.length === 0) return rows;

  const parentByPlayerId = new Map<string, RegistrationParentLookupRow>();
  const playerNameByPlayerId = new Map<string, string>();
  for (const row of rows) {
    const playerId = typeof row.joueur_id === "string" ? row.joueur_id : "";
    if (!playerId) continue;
    const fullName = getPaymentRowPlayerFullName(row);
    if (fullName) {
      playerNameByPlayerId.set(playerId, fullName);
    }
  }

  const registerRows = (items: RegistrationParentLookupRow[]) => {
    for (const item of items) {
      const playerId = typeof item.player_id === "string" ? item.player_id : "";
      if (!playerId) continue;

      const existing = parentByPlayerId.get(playerId);
      const existingTime = existing?.created_at ? new Date(existing.created_at).getTime() : 0;
      const currentTime = item.created_at ? new Date(item.created_at).getTime() : 0;

      if (!existing || currentTime >= existingTime) {
        parentByPlayerId.set(playerId, item);
      }
    }
  };

  const queryParentRows = async (tableName: "inscriptions_joueurs" | "inscriptions_stage") => {
    const { data, error } = await supabase
      .from(tableName)
      .select(
        "player_id, nom_parent_tuteur, telephone_parent_tuteur, nom_complet, email, telephone, created_at"
      )
      .in("player_id", playerIds)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error) || error.code === "42703") return [];
      throw new Error(error.message);
    }

    return (data ?? []) as RegistrationParentLookupRow[];
  };

  const [juniorRows, stageRows] = await Promise.all([
    queryParentRows("inscriptions_joueurs"),
    queryParentRows("inscriptions_stage"),
  ]);

  registerRows(juniorRows);
  registerRows(stageRows);

  const unresolvedNames = Array.from(
    new Set(
      playerIds
        .filter((playerId) => !parentByPlayerId.has(playerId))
        .map((playerId) => playerNameByPlayerId.get(playerId) ?? "")
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
    )
  );

  const parentByPlayerName = new Map<string, RegistrationParentLookupRow>();
  const unresolvedNameSet = new Set(unresolvedNames.map((name) => normalizeLookupName(name)));
  const unresolvedExactNameCandidates = unresolvedNames.slice(0, PAYMENT_NAME_LOOKUP_MAX_CANDIDATES);
  const registerRowsByName = (items: RegistrationParentLookupRow[]) => {
    for (const item of items) {
      const fullName = typeof item.nom_complet === "string" ? item.nom_complet.trim() : "";
      if (!fullName) continue;

      const normalizedName = normalizeLookupName(fullName);
      const existing = parentByPlayerName.get(normalizedName);
      const existingTime = existing?.created_at ? new Date(existing.created_at).getTime() : 0;
      const currentTime = item.created_at ? new Date(item.created_at).getTime() : 0;

      if (!existing || currentTime >= existingTime) {
        parentByPlayerName.set(normalizedName, item);
      }
    }
  };

  const queryParentRowsByName = async (tableName: "inscriptions_joueurs" | "inscriptions_stage") => {
    if (unresolvedNameSet.size === 0) return [];

    if (unresolvedExactNameCandidates.length > 0) {
      const exactRows: RegistrationParentLookupRow[] = [];
      for (const nameChunk of chunkValues(unresolvedExactNameCandidates, 25)) {
        const { data, error } = await supabase
          .from(tableName)
          .select(
            "player_id, nom_parent_tuteur, telephone_parent_tuteur, nom_complet, email, telephone, created_at"
          )
          .in("nom_complet", nameChunk)
          .order("created_at", { ascending: false })
          .limit(PAYMENT_NAME_LOOKUP_SCAN_LIMIT);

        if (error) {
          if (isMissingTableError(error) || error.code === "42703") return [];
          throw new Error(error.message);
        }

        exactRows.push(...((data ?? []) as RegistrationParentLookupRow[]));
      }

      if (exactRows.length > 0) {
        return exactRows;
      }
    }

    const { data, error } = await supabase
      .from(tableName)
      .select(
        "player_id, nom_parent_tuteur, telephone_parent_tuteur, nom_complet, email, telephone, created_at"
      )
      .not("nom_complet", "is", null)
      .order("created_at", { ascending: false })
      .limit(PAYMENT_NAME_LOOKUP_SCAN_LIMIT);

    if (error) {
      if (isMissingTableError(error) || error.code === "42703") return [];
      throw new Error(error.message);
    }

    return ((data ?? []) as RegistrationParentLookupRow[]).filter((item) => {
      const fullName = typeof item.nom_complet === "string" ? item.nom_complet : "";
      return unresolvedNameSet.has(normalizeLookupName(fullName));
    });
  };

  if (unresolvedNames.length > 0) {
    const [juniorRowsByName, stageRowsByName] = await Promise.all([
      queryParentRowsByName("inscriptions_joueurs"),
      queryParentRowsByName("inscriptions_stage"),
    ]);
    registerRowsByName(juniorRowsByName);
    registerRowsByName(stageRowsByName);
  }

  return rows.map((row) => {
    const playerId = typeof row.joueur_id === "string" ? row.joueur_id : "";
    const playerFullName = playerId ? playerNameByPlayerId.get(playerId) ?? null : null;
    const parentInfoById = playerId ? parentByPlayerId.get(playerId) : undefined;
    const parentInfoByName =
      !parentInfoById && playerFullName
        ? parentByPlayerName.get(normalizeLookupName(playerFullName))
        : undefined;
    const parentInfo = parentInfoById ?? parentInfoByName;

    return {
      ...row,
      parent_name: parentInfo?.nom_parent_tuteur ?? null,
      parent_phone: parentInfo?.telephone_parent_tuteur ?? null,
      registration_player_name: parentInfo?.nom_complet ?? null,
      registration_email: parentInfo?.email ?? null,
      registration_phone: parentInfo?.telephone ?? null,
    };
  });
}

function buildSelectExpression(table: string, config: DashboardTableConfig): string {
  const virtualColumns = TABLES_WITH_VIRTUAL_REGISTRATION_ID.has(table)
    ? new Set(["registration_id"])
    : new Set<string>();

  const selectColumns = Array.from(
    new Set(["id", ...config.listColumns, ...config.createFields.filter(f => !f.sensitive && !f.transient).map((field) => field.key)])
  ).filter((column) => !virtualColumns.has(column));

  // Include related player identity when listing payments so the UI can show names
  // instead of raw UUIDs in the "Player" column.
  if (table === "paiements" && !selectColumns.includes("joueurs(prenom, nom)")) {
    selectColumns.push("joueurs(prenom, nom)");
  }

  return selectColumns.join(", ");
}

function coerceFieldValue(field: DashboardTableField, value: unknown): unknown {
  if (field.type === "boolean") {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "on"].includes(normalized)) return true;
      if (["false", "0", "no", "off"].includes(normalized)) return false;
    }
    throw new Error(`Invalid boolean for ${field.label}.`);
  }

  if (field.type === "number") {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    throw new Error(`Invalid number for ${field.label}.`);
  }

  if (field.type === "json") {
    if (typeof value === "object" && value !== null) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch {
        throw new Error(`Invalid JSON for ${field.label}.`);
      }
    }
    throw new Error(`Invalid JSON for ${field.label}.`);
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid value for ${field.label}.`);
  }

  const trimmed = value.trim();

  if (field.type === "datetime") {
    const parsedDate = new Date(trimmed);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid datetime for ${field.label}.`);
    }
    return parsedDate.toISOString();
  }

  return trimmed;
}

export function getDashboardTableNames(): DashboardTableName[] {
  return Object.keys(TABLE_CONFIGS) as DashboardTableName[];
}

export function getDashboardTableConfig(table: string): DashboardTableConfig | null {
  if (table in TABLE_CONFIGS) {
    return TABLE_CONFIGS[table as DashboardTableName];
  }
  return null;
}

export function normalizeTablePayload(
  table: string,
  raw: Record<string, unknown>,
  mode: "create" | "update"
): Record<string, unknown> {
  const config = getDashboardTableConfig(table);
  if (!config) {
    throw new Error("Unsupported table.");
  }

  const payload: Record<string, unknown> = {};
  for (const field of config.createFields) {
    const value = raw[field.key];
    const isEmpty = isEmptyValue(value);

    if (mode === "create" && field.required && isEmpty) {
      throw new Error(`Missing required field: ${field.key}`);
    }

    if (isEmpty) {
      if (mode === "update") {
        continue;
      }
      continue;
    }

    payload[field.key] = coerceFieldValue(field, value);
  }

  return payload;
}

export async function getDashboardTableRows(table: string, limit = 80): Promise<Record<string, unknown>[]> {
  const config = getDashboardTableConfig(table);
  if (!config) {
    throw new Error("Unsupported table.");
  }

  const supabase = createSupabaseServiceClient();
  const safeLimit = Math.max(1, Math.min(limit, 300));
  const selectExpr = buildSelectExpression(table, config);

  const { data, error } = await supabase
    .from(config.table)
    .select(selectExpr)
    .order(config.orderBy ?? "created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  const rawRows = (data ?? []) as unknown as Record<string, unknown>[];
  let rows = withVirtualColumns(table, rawRows);

  if (table === "paiements") {
    try {
      rows = await enrichPaymentRowsWithRegistrationDetails(supabase, rows);
    } catch (error) {
      console.error("[dashboard] Payment enrichment failed, returning base rows.", error);
    }
    return rows;
  }

  if (table !== "actualites" || rows.length === 0) {
    return rows;
  }

  const articleIds = new Set(
    rows
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
  );

  if (articleIds.size === 0) {
    return buildArticleRowsWithCachedClicks(rows);
  }

  const articlePaths = Array.from(articleIds).map((articleId) => `/news/article/${articleId}`);
  const clickResult = await resolveWithinTimeout<SiteEventQueryResult>(
    (async () => {
      const { data: clickData, error: clickError } = await supabase
        .from("site_events")
        .select("path, event_value, metadata")
        .eq("event_type", "page_view")
        .in("path", articlePaths)
        .limit(ARTICLE_EVENTS_QUERY_LIMIT);
      return {
        data: (clickData ?? null) as SiteEventClickRow[] | null,
        error: clickError,
      };
    })(),
    ARTICLE_EVENTS_QUERY_TIMEOUT_MS
  );

  if (!clickResult) {
    console.warn(
      `[dashboard] Article click analytics timeout after ${ARTICLE_EVENTS_QUERY_TIMEOUT_MS}ms. Using cached values.`
    );
    return buildArticleRowsWithCachedClicks(rows);
  }

  const { data: clickData, error: clickError } = clickResult;

  if (clickError) {
    if (isMissingTableError(clickError)) {
      return buildArticleRowsWithCachedClicks(rows);
    }
    console.error("[dashboard] Article click analytics query failed. Using cached values.", clickError.message);
    return buildArticleRowsWithCachedClicks(rows);
  }

  const clickMap = new Map<string, number>();
  for (const eventRow of (clickData ?? []) as SiteEventClickRow[]) {
    const articleIdFromPath = extractArticleIdFromPath(eventRow.path);
    const articleIdFromMetadata = extractArticleIdFromMetadata(eventRow.metadata);
    const articleId = articleIdFromMetadata ?? articleIdFromPath;
    if (!articleId || !articleIds.has(articleId)) continue;

    const previous = clickMap.get(articleId) ?? 0;
    clickMap.set(articleId, previous + toPositiveCount(eventRow.event_value));
  }

  const now = Date.now();
  for (const [articleId, clickCount] of clickMap) {
    ARTICLE_CLICK_CACHE.set(articleId, { count: clickCount, updatedAt: now });
  }

  return buildArticleRowsWithClicksFromMap(rows, clickMap);
}

export async function getDashboardRegistrationRowsByStatut(
  table: "inscriptions_joueurs" | "inscriptions_stage",
  statut: RegistrationStatut,
  limit = 300
): Promise<Record<string, unknown>[]> {
  const config = getDashboardTableConfig(table);
  if (!config) {
    throw new Error("Unsupported table.");
  }

  const supabase = createSupabaseServiceClient();
  const safeLimit = Math.max(1, Math.min(limit, 500));
  const selectExpr = buildSelectExpression(table, config);

  const { data, error } = await supabase
    .from(config.table)
    .select(selectExpr)
    .eq("statut", statut)
    .order(config.orderBy ?? "created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  const rawRows = (data ?? []) as unknown as Record<string, unknown>[];
  return withVirtualColumns(table, rawRows);
}

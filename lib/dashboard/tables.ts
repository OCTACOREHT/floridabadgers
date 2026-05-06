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
  | "json";

export type DashboardTableField = {
  key: string;
  label: string;
  type: FieldKind;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type DashboardTableConfig = {
  table: string;
  label: string;
  description: string;
  listColumns: string[];
  createFields: DashboardTableField[];
  orderBy?: string;
};

const TABLE_CONFIGS = {
  users: {
    table: "users",
    label: "Users",
    description: "Club users and roles",
    listColumns: ["full_name", "email", "role", "photo_url", "created_at"],
    createFields: [
      { key: "full_name", label: "Full Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "role", label: "Role", type: "select", required: true, options: ["user", "player"] },
      { key: "photo_url", label: "Photo", type: "text", placeholder: "Ajouter une photo" },
    ],
  },
  actualites: {
    table: "actualites",
    label: "Articles",
    description: "News and media articles",
    listColumns: ["titre", "sous_titre", "is_published", "auteur_id", "created_at"],
    createFields: [
      { key: "titre", label: "Title", type: "text", required: true },
      { key: "sous_titre", label: "Subtitle", type: "text" },
      { key: "photo_url", label: "Photo", type: "text", placeholder: "Ajouter une photo" },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "auteur_id", label: "Author ID", type: "uuid" },
      { key: "is_published", label: "Published", type: "boolean" },
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
    listColumns: ["prenom", "nom", "poste", "niveau", "is_active", "created_at"],
    createFields: [
      { key: "nom", label: "Last Name", type: "text", required: true },
      { key: "prenom", label: "First Name", type: "text", required: true },
      { key: "photo_url", label: "Photo", type: "text", placeholder: "Ajouter une photo" },
      { key: "date_naissance", label: "Birth Date", type: "date" },
      { key: "age", label: "Age", type: "number" },
      { key: "sexe", label: "Sex", type: "select", options: ["Masculin", "Feminin"] },
      { key: "categorie_id", label: "Category ID", type: "uuid" },
      { key: "poste", label: "Position", type: "select", options: ["Gardien", "Defenseur", "Milieu", "Attaquant"] },
      { key: "niveau", label: "Level", type: "select", options: ["Debutant", "Intermediaire", "Avance"] },
      { key: "dossard", label: "Jersey Number", type: "number" },
      { key: "taille", label: "Height", type: "text" },
      { key: "poids", label: "Weight", type: "text" },
      { key: "nationalite", label: "Nationality", type: "text" },
    ],
  },
  inscriptions_joueurs: {
    table: "inscriptions_joueurs",
    label: "Junior Registrations",
    description: "Junior registrations submitted from join form",
    listColumns: ["nom_complet", "programme_inscription", "statut", "email", "telephone", "created_at"],
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
  inscriptions_stage: {
    table: "inscriptions_stage",
    label: "Stage Registrations",
    description: "Stage (English) registrations",
    listColumns: ["nom_complet", "programme_inscription", "statut", "email", "telephone", "created_at"],
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
  site_events: {
    table: "site_events",
    label: "Site Events",
    description: "Tracked website events",
    listColumns: ["event_type", "path", "source", "event_value", "created_at"],
    createFields: [
      { key: "event_type", label: "Event Type", type: "select", required: true, options: ["page_view", "registration_submitted", "contact_submitted"] },
      { key: "path", label: "Path", type: "text", required: true },
      { key: "source", label: "Source", type: "text" },
      { key: "event_value", label: "Event Value", type: "number" },
      { key: "metadata", label: "Metadata (JSON)", type: "json", placeholder: "{\"key\":\"value\"}" },
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

  const selectColumns = Array.from(
    new Set(["id", ...config.listColumns, ...config.createFields.map((field) => field.key)])
  );
  const selectExpr = selectColumns.join(", ");

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

  return (data ?? []) as unknown as Record<string, unknown>[];
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { trackSiteEvent } from "@/lib/analytics/events";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { enforceRateLimit, rejectCrossSiteRequest } from "@/lib/security/http-guard";
import {
  createClubMailerContext,
  escapeHtml,
  renderClubBrandedEmail,
} from "@/lib/email/club-email";

type RegistrationInput = {
  programme_inscription:
    | "junior_foundation"
    | "junior_development"
    | "junior_elite"
    | "stage_english";
  nom_complet: string;
  date_naissance: string;
  sexe: "Male" | "Female" | "Masculin" | "Feminin";
  adresse: string;
  telephone: string;
  email: string;
  recaptchaToken?: string | null;
  photo_url?: string | null;
  poste_jeu: "Goalkeeper" | "Defender" | "Midfielder" | "Forward" | "Gardien" | "Defenseur" | "Milieu" | "Attaquant";
  niveau_jeu: "Beginner" | "Intermediate" | "Advanced" | "Debutant" | "Intermediaire" | "Avance";
  club_actuel?: string | null;
  experience_football?: string | null;
  categorie_id: string;
  inscrit_par: "parent_tuteur" | "joueur";
  relation_avec_joueur?: string | null;
  probleme_sante: boolean;
  probleme_sante_details?: string | null;
  allergies_connues?: string | null;
  contact_urgence_nom: string;
  contact_urgence_telephone: string;
  contact_urgence_relation: string;
  contact_urgence_email?: string | null;
  contact_urgence_adresse?: string | null;
  nom_parent_tuteur?: string | null;
  telephone_parent_tuteur?: string | null;
  autorisation_parentale: boolean;
  consentement_soins_urgence: boolean;
  accepte_regles_stage: boolean;
  confirme_infos_correctes: boolean;
  waiver_accepted: boolean;
  signature_nom?: string | null;
  signature_date?: string | null;
  signature_parent_nom?: string | null;
  signature_parent_date?: string | null;
};

type LegacyValueSet = {
  sexe: string;
  poste_jeu: string;
  niveau_jeu: string;
};

type PersistedRegistration = {
  id: string | number;
  registration_id: string | null;
  created_at: string | null;
  statut: string | null;
};

type InsertErrorShape = {
  code?: string;
  message?: string;
};

type FlexibleInsertResult = {
  data: PersistedRegistration | null;
  errors: string[];
  removedColumns: string[];
  lastError: InsertErrorShape | null;
};

function createRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function logRegistrationIssue(
  level: "warn" | "error",
  requestId: string,
  stage: string,
  details: Record<string, unknown>
) {
  const entry = {
    requestId,
    stage,
    ...details,
  };
  if (level === "warn") {
    console.warn("[registration]", entry);
    return;
  }
  console.error("[registration]", entry);
}

function isRegistrationProgram(value: unknown): value is RegistrationInput["programme_inscription"] {
  return (
    value === "junior_foundation" ||
    value === "junior_development" ||
    value === "junior_elite" ||
    value === "stage_english"
  );
}

function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLoose(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isLegacyCategorieAgeLabel(value: string): boolean {
  const normalized = normalizeLoose(value);
  return (
    /^\d{1,2}\s*-\s*\d{1,2}\s*ans$/.test(normalized) ||
    /^\d{1,2}\s*ans\s*et\s*plus$/.test(normalized)
  );
}

function resolveLegacyCategorieAgeLabel(age: number, categoryName: string): string {
  const trimmed = categoryName.trim();
  if (trimmed && isLegacyCategorieAgeLabel(trimmed)) {
    return trimmed;
  }

  if (age <= 10) return "8-10 ans";
  if (age <= 13) return "11-13 ans";
  if (age <= 17) return "14-17 ans";
  return "18 ans et plus";
}

function buildCategorieAgeCandidates(age: number, categoryName: string): string[] {
  const candidates = [
    resolveLegacyCategorieAgeLabel(age, categoryName),
    categoryName.trim(),
  ].filter(Boolean);

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateRegistrationId(fullName: string): string {
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.substring(0, 2).toUpperCase())
    .join("")
    .slice(0, 6);

  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FBCA-${initials || "PL"}-${randomSuffix}`;
}

function shouldFallbackToLegacy(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "23514") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("categorie_id") || msg.includes("check constraint");
}

function isMissingColumnError(error: InsertErrorShape | null): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes(" does not exist") ||
    message.includes("could not find the column") ||
    message.includes("schema cache")
  );
}

function extractMissingColumnName(error: InsertErrorShape | null): string | null {
  if (!error?.message) return null;

  const fromPostgres = error.message.match(/column ["']?([a-zA-Z0-9_]+)["']? of relation/i);
  if (fromPostgres?.[1]) return fromPostgres[1];

  const fromPostgrest = error.message.match(/could not find the ['"]([a-zA-Z0-9_]+)['"] column/i);
  if (fromPostgrest?.[1]) return fromPostgrest[1];

  return null;
}

function toPersistedRegistrationRecord(value: unknown): PersistedRegistration | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;

  const rawId = row.id;
  if (typeof rawId !== "string" && typeof rawId !== "number") return null;

  return {
    id: rawId,
    registration_id: typeof row.registration_id === "string" ? row.registration_id : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    statut: typeof row.statut === "string" ? row.statut : null,
  };
}

async function insertRegistrationFlexible(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  table: "inscriptions_joueurs" | "inscriptions_stage",
  inputPayload: Record<string, unknown>
): Promise<FlexibleInsertResult> {
  const payload: Record<string, unknown> = { ...inputPayload };
  const removedColumns: string[] = [];
  const errors: string[] = [];
  let lastError: InsertErrorShape | null = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const insertResult = await supabase.from(table).insert(payload).select("*").single();
    if (!insertResult.error) {
      const normalized = toPersistedRegistrationRecord(insertResult.data);
      if (normalized) {
        return {
          data: normalized,
          errors,
          removedColumns,
          lastError: null,
        };
      }

      return {
        data: null,
        errors: [...errors, "Insert succeeded but returned row shape is invalid."],
        removedColumns,
        lastError: { message: "Insert succeeded but returned row shape is invalid." },
      };
    }

    lastError = insertResult.error;
    errors.push(insertResult.error.message ?? "Unknown insert error.");

    if (!isMissingColumnError(insertResult.error)) {
      break;
    }

    const missingColumn = extractMissingColumnName(insertResult.error);
    if (!missingColumn || !(missingColumn in payload)) {
      break;
    }

    delete payload[missingColumn];
    removedColumns.push(missingColumn);
  }

  return {
    data: null,
    errors,
    removedColumns,
    lastError,
  };
}

function mapSchemaCanonicalValues(input: RegistrationInput): LegacyValueSet {
  const sexeMap: Record<string, string> = {
    Male: "Masculin",
    Female: "Feminin",
    Masculin: "Masculin",
    Feminin: "Feminin",
  };
  const posteMap: Record<string, string> = {
    Goalkeeper: "Gardien",
    Defender: "Defenseur",
    Midfielder: "Milieu",
    Forward: "Attaquant",
    Gardien: "Gardien",
    Defenseur: "Defenseur",
    Milieu: "Milieu",
    Attaquant: "Attaquant",
  };
  const niveauMap: Record<string, string> = {
    Beginner: "Debutant",
    Intermediate: "Intermediaire",
    Advanced: "Avance",
    Debutant: "Debutant",
    Intermediaire: "Intermediaire",
    Avance: "Avance",
  };

  return {
    sexe: sexeMap[input.sexe] || input.sexe,
    poste_jeu: posteMap[input.poste_jeu] || input.poste_jeu,
    niveau_jeu: niveauMap[input.niveau_jeu] || input.niveau_jeu,
  };
}

function mapLegacyWithAccents(input: RegistrationInput): LegacyValueSet {
  const sexeMap: Record<string, string> = { Male: "Masculin", Female: "F\u00E9minin", Masculin: "Masculin", Feminin: "F\u00E9minin" };
  const posteMap: Record<string, string> = {
    Goalkeeper: "Gardien",
    Defender: "D\u00E9fenseur",
    Midfielder: "Milieu",
    Forward: "Attaquant",
    Gardien: "Gardien",
    Defenseur: "D\u00E9fenseur",
    Milieu: "Milieu",
    Attaquant: "Attaquant",
  };
  const niveauMap: Record<string, string> = {
    Beginner: "D\u00E9butant",
    Intermediate: "Interm\u00E9diaire",
    Advanced: "Avanc\u00E9",
    Debutant: "D\u00E9butant",
    Intermediaire: "Interm\u00E9diaire",
    Avance: "Avanc\u00E9",
  };

  return {
    sexe: sexeMap[input.sexe] || input.sexe,
    poste_jeu: posteMap[input.poste_jeu] || input.poste_jeu,
    niveau_jeu: niveauMap[input.niveau_jeu] || input.niveau_jeu,
  };
}

function mapLegacyMojibake(input: RegistrationInput): LegacyValueSet {
  const sexeMap: Record<string, string> = { Male: "Masculin", Female: "Féminin", Masculin: "Masculin", Feminin: "Féminin" };
  const posteMap: Record<string, string> = {
    Goalkeeper: "Gardien",
    Defender: "Défenseur",
    Midfielder: "Milieu",
    Forward: "Attaquant",
    Gardien: "Gardien",
    Defenseur: "Défenseur",
    Milieu: "Milieu",
    Attaquant: "Attaquant",
  };
  const niveauMap: Record<string, string> = {
    Beginner: "Débutant",
    Intermediate: "Intermédiaire",
    Advanced: "Avancé",
    Debutant: "Débutant",
    Intermediaire: "Intermédiaire",
    Avance: "Avancé",
  };

  return {
    sexe: sexeMap[input.sexe] || input.sexe,
    poste_jeu: posteMap[input.poste_jeu] || input.poste_jeu,
    niveau_jeu: niveauMap[input.niveau_jeu] || input.niveau_jeu,
  };
}

function buildLegacyValueCandidates(input: RegistrationInput): LegacyValueSet[] {
  const candidates = [
    mapSchemaCanonicalValues(input),
    mapLegacyWithAccents(input),
    {
      sexe: input.sexe,
      poste_jeu: input.poste_jeu,
      niveau_jeu: input.niveau_jeu,
    },
    mapLegacyMojibake(input),
  ];

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.sexe}|${candidate.poste_jeu}|${candidate.niveau_jeu}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatProgramLabel(program: RegistrationInput["programme_inscription"]): string {
  if (program === "stage_english") return "Tryout Registration";
  return "Club Registration";
}

async function sendRegistrationEmails(params: {
  fullName: string;
  email: string;
  phone: string;
  category: string;
  program: RegistrationInput["programme_inscription"];
  registration: PersistedRegistration;
}) {
  const mailer = createClubMailerContext();
  const reference = params.registration.registration_id || String(params.registration.id);
  const submittedAt = params.registration.created_at
    ? new Date(params.registration.created_at).toLocaleString("en-US")
    : new Date().toLocaleString("en-US");

  const programLabel = formatProgramLabel(params.program);

  const adminText = [
    "New registration submitted",
    "",
    `Registration ID: ${reference}`,
    `Name: ${params.fullName}`,
    `Email: ${params.email}`,
    `Phone: ${params.phone}`,
    `Category: ${params.category}`,
    `Program: ${programLabel}`,
    `Submitted At: ${submittedAt}`,
  ].join("\n");

  const adminHtml = renderClubBrandedEmail({
    logoHtml: mailer.logoHtml,
    bannerTitle: "Application Received",
    bannerSubtitle: "A new player registration was submitted.",
    greeting: "Hello Florida Badgers Team,",
    referenceLabel: "Registration ID",
    referenceValue: reference,
    contentHtml: `
      <p style="margin:0 0 14px 0;">A new registration is now available for review.</p>
      <p style="margin:0 0 8px 0;"><strong>Player Name:</strong> ${escapeHtml(params.fullName)}</p>
      <p style="margin:0 0 8px 0;"><strong>Email:</strong> ${escapeHtml(params.email)}</p>
      <p style="margin:0 0 8px 0;"><strong>Phone:</strong> ${escapeHtml(params.phone)}</p>
      <p style="margin:0 0 8px 0;"><strong>Category:</strong> ${escapeHtml(params.category)}</p>
      <p style="margin:0 0 8px 0;"><strong>Program:</strong> ${escapeHtml(programLabel)}</p>
      <p style="margin:0;"><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    `,
  });

  await mailer.transporter.sendMail({
    from: mailer.fromWithName,
    to: mailer.registrationTo,
    replyTo: params.email,
    subject: `New Registration - ${reference}`,
    text: adminText,
    html: adminHtml,
    attachments: mailer.attachments,
  });

  const ackText = [
    "Application Received",
    "",
    `Hello ${params.fullName},`,
    "",
    "We have successfully received your registration.",
    `Registration ID: ${reference}`,
    "",
    "Our team will review your application and contact you shortly by email or phone.",
    "",
    "Florida Badgers FCA Team",
  ].join("\n");

  const ackHtml = renderClubBrandedEmail({
    logoHtml: mailer.logoHtml,
    bannerTitle: "Application Received",
    bannerSubtitle: "Thank you for registering with Florida Badgers FCA.",
    greeting: `Hello ${params.fullName},`,
    referenceLabel: "Registration ID",
    referenceValue: reference,
    contentHtml: `
      <p style="margin:0 0 14px 0;">
        We have successfully received your registration for <strong>${escapeHtml(programLabel)}</strong>.
      </p>
      <p style="margin:0 0 8px 0;"><strong>Category:</strong> ${escapeHtml(params.category)}</p>
      <p style="margin:0 0 8px 0;"><strong>Phone:</strong> ${escapeHtml(params.phone)}</p>
      <p style="margin:0;"><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
      <p style="margin:14px 0 0 0;">
        Our team will review your application carefully and contact you soon for the next steps.
      </p>
    `,
  });

  await mailer.transporter.sendMail({
    from: mailer.fromWithName,
    to: params.email,
    subject: `Registration Received - ${reference}`,
    text: ackText,
    html: ackHtml,
    attachments: mailer.attachments,
  });
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) {
    logRegistrationIssue("warn", requestId, "origin_guard", {
      status: crossSiteResponse.status,
      origin: request.headers.get("origin"),
      host: request.headers.get("host"),
    });
    return crossSiteResponse;
  }

  const limiterResponse = enforceRateLimit(request, {
    keyPrefix: "registration-form",
    limit: 6,
    windowMs: 15 * 60 * 1000,
  });
  if (limiterResponse) {
    logRegistrationIssue("warn", requestId, "rate_limit", {
      status: limiterResponse.status,
      ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
    });
    return limiterResponse;
  }

  try {
    const body = (await request.json()) as Partial<RegistrationInput>;

    const requiredFields = [
      "programme_inscription",
      "nom_complet",
      "date_naissance",
      "sexe",
      "adresse",
      "telephone",
      "email",
      "poste_jeu",
      "niveau_jeu",
      "categorie_id",
      "inscrit_par",
      "contact_urgence_nom",
      "contact_urgence_telephone",
      "contact_urgence_relation",
    ] as const;

    for (const field of requiredFields) {
      const value = body[field];
      if (typeof value !== "string" || !value.trim()) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const shouldEnforceRecaptcha =
      process.env.RECAPTCHA_SECRET_KEY?.trim() &&
      process.env.RECAPTCHA_ENFORCED !== "false";
    if (shouldEnforceRecaptcha) {
      const recaptcha = await verifyRecaptchaToken(normalizeText(body.recaptchaToken));
      if (!recaptcha.success) {
        logRegistrationIssue("warn", requestId, "recaptcha_verify", {
          error: recaptcha.error ?? "recaptcha verification failed",
          errorCodes: recaptcha.errorCodes ?? [],
          hostname: recaptcha.hostname ?? null,
        });
        return NextResponse.json(
          {
            error: recaptcha.error ?? "Invalid reCAPTCHA verification.",
            requestId,
          },
          { status: 400 }
        );
      }
    }

    if (!body.accepte_regles_stage || !body.confirme_infos_correctes || !body.consentement_soins_urgence) {
      return NextResponse.json(
        { error: "You must accept rules, confirm your information, and consent to emergency care." },
        { status: 400 }
      );
    }

    if (!isRegistrationProgram(body.programme_inscription)) {
      return NextResponse.json({ error: "Invalid registration program." }, { status: 400 });
    }

    if (!isUuid(body.categorie_id as string)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const isStageRegistration = body.programme_inscription === "stage_english";

    const age = calculateAge(body.date_naissance as string);
    if (Number.isNaN(age) || age < 5 || age > 40) {
      return NextResponse.json({ error: "Invalid date of birth. Allowed range is 5 to 40 years." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();

    // Fetch category name for backward compatibility with legacy schema
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("nom")
      .eq("id", body.categorie_id as string)
      .maybeSingle();

    if (categoryError || !category?.nom) {
      return NextResponse.json(
        { error: "Could not find the selected category." },
        { status: 400 }
      );
    }

    const isMinor = age < 18;
    const parentName = isMinor ? normalizeText(body.nom_parent_tuteur) : "";
    const parentPhone = isMinor ? normalizeText(body.telephone_parent_tuteur) : "";
    if (isMinor && (!parentName || !parentPhone || body.autorisation_parentale !== true)) {
      return NextResponse.json(
        { error: "For minors, parent/tutor info and parental authorization are required." },
        { status: 400 }
      );
    }

    const normalizedFullName = normalizeText(body.nom_complet);
    const registrationId = generateRegistrationId(normalizedFullName);
    const schemaCandidate = mapSchemaCanonicalValues(body as RegistrationInput);
    const targetTable = isStageRegistration ? "inscriptions_stage" : "inscriptions_joueurs";
    const categorieAgeCandidates = buildCategorieAgeCandidates(age, category.nom);
    const primaryCategorieAge = categorieAgeCandidates[0] ?? category.nom;

    const payloadBase = {
      programme_inscription: body.programme_inscription,
      nom_complet: normalizedFullName,
      date_naissance: body.date_naissance,
      age,
      sexe: schemaCandidate.sexe,
      adresse: normalizeText(body.adresse),
      telephone: normalizeText(body.telephone),
      email: normalizeText(body.email),
      photo_url: normalizeText(body.photo_url) || null,
      poste_jeu: schemaCandidate.poste_jeu,
      niveau_jeu: schemaCandidate.niveau_jeu,
      club_actuel: normalizeText(body.club_actuel) || null,
      experience_football: normalizeText(body.experience_football) || null,
      categorie_id: body.categorie_id,
      registration_id: registrationId,
      inscrit_par: isMinor ? body.inscrit_par : "joueur",
      relation_avec_joueur: isMinor ? normalizeText(body.relation_avec_joueur) || null : null,
      probleme_sante: Boolean(body.probleme_sante),
      probleme_sante_details: normalizeText(body.probleme_sante_details) || null,
      allergies_connues: normalizeText(body.allergies_connues) || null,
      contact_urgence_nom: normalizeText(body.contact_urgence_nom),
      contact_urgence_telephone: normalizeText(body.contact_urgence_telephone),
      contact_urgence_relation: normalizeText(body.contact_urgence_relation),
      contact_urgence_email: normalizeText(body.contact_urgence_email) || null,
      contact_urgence_adresse: normalizeText(body.contact_urgence_adresse) || null,
      nom_parent_tuteur: parentName || null,
      telephone_parent_tuteur: parentPhone || null,
      autorisation_parentale: isMinor ? Boolean(body.autorisation_parentale) : false,
      consentement_soins_urgence: Boolean(body.consentement_soins_urgence),
      accepte_regles_stage: Boolean(body.accepte_regles_stage),
      confirme_infos_correctes: Boolean(body.confirme_infos_correctes),
      waiver_accepted: Boolean(body.waiver_accepted),
      signature_nom: normalizeText(body.signature_nom) || null,
      signature_date: body.signature_date || null,
      signature_parent_nom: normalizeText(body.signature_parent_nom) || null,
      signature_parent_date: body.signature_parent_date || null,
    };
    const payload = isStageRegistration
      ? payloadBase
      : {
        ...payloadBase,
        // Keep backward compatibility with deployments where this column remains NOT NULL.
        categorie_age: primaryCategorieAge,
      };

    const modernInsert = await insertRegistrationFlexible(
      supabase,
      targetTable,
      payload as Record<string, unknown>
    );
    const modernErrorMessage =
      modernInsert.errors[modernInsert.errors.length - 1] ??
      modernInsert.lastError?.message ??
      "Unknown registration insert error.";

    if (modernInsert.data) {
      const data = modernInsert.data;
      await trackSiteEvent({
        eventType: "registration_submitted",
        path: "/join",
        source: "registration-api",
        metadata: {
          registrationId: data.id,
          customRegistrationId: data.registration_id,
          targetTable,
          programme: body.programme_inscription,
        },
      });

      try {
        await sendRegistrationEmails({
          fullName: normalizedFullName,
          email: normalizeText(body.email),
          phone: normalizeText(body.telephone),
          category: category.nom,
          program: body.programme_inscription,
          registration: data as PersistedRegistration,
        });
      } catch (mailError) {
        console.error("[registration-email] Failed to send registration emails", mailError);
      }

      return NextResponse.json({ success: true, registration: data }, { status: 201 });
    }

    if (isStageRegistration) {
      logRegistrationIssue("error", requestId, "stage_modern_insert_failed", {
        errors: modernInsert.errors,
        removedColumns: modernInsert.removedColumns,
      });
      return NextResponse.json(
        {
          error:
            modernErrorMessage ??
            "Tryout registration failed. Ensure the 'inscriptions_stage' table exists and migrations are applied.",
          requestId,
          details: {
            modern: modernInsert.errors,
            removedColumns: modernInsert.removedColumns,
          },
        },
        { status: 500 }
      );
    }

    if (!shouldFallbackToLegacy(modernInsert.lastError)) {
      logRegistrationIssue("error", requestId, "modern_insert_failed_no_legacy_fallback", {
        errors: modernInsert.errors,
        removedColumns: modernInsert.removedColumns,
      });
      return NextResponse.json(
        {
          error: modernErrorMessage,
          requestId,
          details: {
            modern: modernInsert.errors,
            removedColumns: modernInsert.removedColumns,
          },
        },
        { status: 500 }
      );
    }


    const legacyCandidates = buildLegacyValueCandidates(body as RegistrationInput);
    const legacyErrors: string[] = [];

    for (const candidate of legacyCandidates) {
      const modernCompatibleFallbackPayload = {
        ...payload,
        sexe: candidate.sexe,
        poste_jeu: candidate.poste_jeu,
        niveau_jeu: candidate.niveau_jeu,
      };

      const legacyPayload = {
        programme_inscription: body.programme_inscription,
        nom_complet: normalizedFullName,
        date_naissance: body.date_naissance,
        age,
        sexe: candidate.sexe,
        adresse: normalizeText(body.adresse),
        telephone: normalizeText(body.telephone),
        email: normalizeText(body.email),
        photo_url: normalizeText(body.photo_url) || null,
        poste_jeu: candidate.poste_jeu,
        niveau_jeu: candidate.niveau_jeu,
        club_actuel: normalizeText(body.club_actuel) || null,
        experience_football: normalizeText(body.experience_football) || null,
        categorie_age: primaryCategorieAge,
        registration_id: registrationId,
        inscrit_par: isMinor ? body.inscrit_par : "joueur",
        relation_avec_joueur: isMinor ? normalizeText(body.relation_avec_joueur) || null : null,
        probleme_sante: Boolean(body.probleme_sante),
        probleme_sante_details: normalizeText(body.probleme_sante_details) || null,
        allergies_connues: normalizeText(body.allergies_connues) || null,
        contact_urgence_nom: normalizeText(body.contact_urgence_nom),
        contact_urgence_telephone: normalizeText(body.contact_urgence_telephone),
        contact_urgence_relation: normalizeText(body.contact_urgence_relation),
        contact_urgence_email: normalizeText(body.contact_urgence_email) || null,
        contact_urgence_adresse: normalizeText(body.contact_urgence_adresse) || null,
        nom_parent_tuteur: parentName || null,
        telephone_parent_tuteur: parentPhone || null,
        autorisation_parentale: Boolean(body.autorisation_parentale),
        consentement_soins_urgence: Boolean(body.consentement_soins_urgence),
        accepte_regles_stage: Boolean(body.accepte_regles_stage),
        confirme_infos_correctes: Boolean(body.confirme_infos_correctes),
        waiver_accepted: Boolean(body.waiver_accepted),
        signature_nom: normalizeText(body.signature_nom) || null,
        signature_date: body.signature_date || null,
        signature_parent_nom: normalizeText(body.signature_parent_nom) || null,
        signature_parent_date: body.signature_parent_date || null,
      };
      const modernCompatibleWithoutCategoryAge = { ...modernCompatibleFallbackPayload };
      const legacyWithoutCategoryAge = { ...legacyPayload };
      delete (modernCompatibleWithoutCategoryAge as Record<string, unknown>).categorie_age;
      delete (legacyWithoutCategoryAge as Record<string, unknown>).categorie_age;

      const fallbackPayloads: Array<{ label: "modern-compatible" | "legacy"; value: Record<string, unknown> }> = [];
      for (const categorieAge of categorieAgeCandidates) {
        fallbackPayloads.push({
          label: "modern-compatible",
          value: {
            ...modernCompatibleFallbackPayload,
            categorie_age: categorieAge,
          } as Record<string, unknown>,
        });
        fallbackPayloads.push({
          label: "legacy",
          value: {
            ...legacyPayload,
            categorie_age: categorieAge,
          } as Record<string, unknown>,
        });
      }
      fallbackPayloads.push({ label: "modern-compatible", value: modernCompatibleWithoutCategoryAge as Record<string, unknown> });
      fallbackPayloads.push({ label: "legacy", value: legacyWithoutCategoryAge as Record<string, unknown> });

      for (const fallbackPayload of fallbackPayloads) {
        const legacyInsert = await insertRegistrationFlexible(
          supabase,
          "inscriptions_joueurs",
          fallbackPayload.value
        );

        if (legacyInsert.data) {
          const legacyData = legacyInsert.data;
          await trackSiteEvent({
            eventType: "registration_submitted",
            path: "/join",
            source: "registration-api",
            metadata: {
              registrationId: legacyData.id,
              customRegistrationId: legacyData.registration_id,
              targetTable: "inscriptions_joueurs",
              programme: body.programme_inscription,
              legacySchema: fallbackPayload.label === "legacy",
              removedColumns: legacyInsert.removedColumns,
            },
          });

          try {
            await sendRegistrationEmails({
              fullName: normalizedFullName,
              email: normalizeText(body.email),
              phone: normalizeText(body.telephone),
              category: category.nom,
              program: body.programme_inscription,
              registration: legacyData,
            });
          } catch (mailError) {
            console.error("[registration-email] Failed to send registration emails", mailError);
          }

          return NextResponse.json({ success: true, registration: legacyData, legacy: true }, { status: 201 });
        }

        const legacyFinalError =
          legacyInsert.errors[legacyInsert.errors.length - 1] ??
          legacyInsert.lastError?.message ??
          "Unknown legacy insert error.";
        legacyErrors.push(
          `[${fallbackPayload.label}] ${legacyFinalError} | removed_columns=${legacyInsert.removedColumns.join(",") || "none"}`
        );
      }
    }

    logRegistrationIssue("error", requestId, "modern_and_legacy_insert_failed", {
      modernErrors: modernInsert.errors,
      modernRemovedColumns: modernInsert.removedColumns,
      legacyErrors,
    });
    return NextResponse.json(
      {
        error: "Registration failed on both modern and legacy schema paths.",
        requestId,
        details: {
          modern: modernInsert.errors.length > 0 ? modernInsert.errors : [modernErrorMessage],
          modernRemovedColumns: modernInsert.removedColumns,
          legacy: legacyErrors,
        },
      },
      { status: 500 }
    );
  } catch (error) {
    logRegistrationIssue("error", requestId, "unexpected_exception", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected server error",
        requestId,
      },
      { status: 500 }
    );
  }
}

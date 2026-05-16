import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  enrichPaymentRowsWithRegistrationDetails,
  getDashboardTableConfig,
  normalizeTablePayload,
} from "@/lib/dashboard/tables";
import { requireApiUser, requireApiUserWithUser } from "@/lib/auth/api-guard";
import { resolveArticleAuthorId } from "@/lib/dashboard/article-author";
import { createClubMailerContext, renderClubBrandedEmail } from "@/lib/email/club-email";
import { canAccessDashboardTable, normalizeDashboardRole } from "@/lib/auth/permissions";

export const runtime = "nodejs";

type RegistrationStatus = "en_attente" | "accepte" | "refuse";
type RegistrationTableName = "inscriptions_joueurs" | "inscriptions_stage";

type RegistrationRow = {
  id: string;
  registration_id?: string | null;
  nom_complet?: string | null;
  date_naissance?: string | null;
  age?: number | null;
  sexe?: string | null;
  email?: string | null;
  photo_url?: string | null;
  poste_jeu?: string | null;
  niveau_jeu?: string | null;
  categorie_id?: string | null;
  statut?: string | null;
  player_id?: string | null;
};

type PromotionResult = {
  playerId: string;
  dossard: number | null;
  createdNow: boolean;
};

type PlayerLegacyValueSet = {
  sexe: string;
  poste: string;
  niveau: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRegistrationTable(table: string): table is RegistrationTableName {
  return table === "inscriptions_joueurs" || table === "inscriptions_stage";
}

function canonicalizeRegistrationStatus(value: unknown): RegistrationStatus | null {
  const normalized = normalizeLoose(asText(value));
  if (!normalized) return null;

  if (
    normalized === "accepte" ||
    normalized === "accepted" ||
    normalized.includes("accept")
  ) {
    return "accepte";
  }

  if (
    normalized === "refuse" ||
    normalized.includes("refus") ||
    normalized.includes("reject") ||
    normalized.includes("declin") ||
    normalized.includes("not accepted")
  ) {
    return "refuse";
  }

  if (
    normalized === "en_attente" ||
    normalized === "pending" ||
    normalized.includes("attente") ||
    normalized.includes("pend")
  ) {
    return "en_attente";
  }

  return null;
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeLoose(value: string): string {
  return stripAccents(value)
    .replaceAll("Ã©", "e")
    .replaceAll("Ã¨", "e")
    .replaceAll("Ãª", "e")
    .replaceAll("Ã", "a")
    .toLowerCase()
    .trim();
}

function normalizeSex(value: string): "Masculin" | "Féminin" | "Feminin" | null {
  const normalized = stripAccents(value).toLowerCase().trim();
  if (!normalized) return null;
  if (normalized.includes("fem")) return "Féminin";
  if (normalized.includes("mas") || normalized === "male") return "Masculin";
  return null;
}

function normalizePoste(value: string): "Gardien" | "Défenseur" | "Defenseur" | "Milieu" | "Attaquant" | null {
  const normalized = stripAccents(value).toLowerCase().trim();
  if (!normalized) return null;
  if (normalized.includes("goal") || normalized.includes("gard")) return "Gardien";
  if (normalized.includes("def")) return "Défenseur";
  if (normalized.includes("mid") || normalized.includes("mil")) return "Milieu";
  if (normalized.includes("forw") || normalized.includes("att")) return "Attaquant";
  return null;
}

function normalizeNiveau(value: string): "Débutant" | "Debutant" | "Intermédiaire" | "Intermediaire" | "Avancé" | "Avance" | null {
  const normalized = normalizeLoose(value);
  if (!normalized) return null;
  if (normalized.includes("beg") || normalized.includes("deb")) return "Débutant";
  if (normalized.includes("int") || normalized.includes("inter")) return "Intermédiaire";
  if (normalized.includes("adv") || normalized.includes("ava")) return "Avancé";
  return null;
}

function getSexCandidates(value: string): string[] {
  const normalized = normalizeLoose(value);
  if (!normalized) return ["Masculin", "Male"];
  if (normalized.includes("fem")) {
    return ["Féminin", "Feminin", "FÃ©minin", "Female"];
  }
  return ["Masculin", "Male"];
}

function getPosteCandidates(value: string): string[] {
  const normalized = normalizeLoose(value);
  if (!normalized) return ["Milieu", "Midfielder"];
  if (normalized.includes("goal") || normalized.includes("gard")) return ["Gardien", "Goalkeeper"];
  if (normalized.includes("def")) return ["Défenseur", "Defenseur", "DÃ©fenseur", "Defender"];
  if (normalized.includes("mid") || normalized.includes("mil")) return ["Milieu", "Midfielder"];
  if (normalized.includes("forw") || normalized.includes("att")) return ["Attaquant", "Forward"];
  return [value, "Milieu", "Midfielder"];
}

function getNiveauCandidates(value: string): string[] {
  const normalized = normalizeLoose(value);
  if (!normalized) return ["Intermédiaire", "Intermediaire", "IntermÃ©diaire", "Intermediate"];
  if (normalized.includes("beg") || normalized.includes("deb")) {
    return ["Débutant", "Debutant", "DÃ©butant", "Beginner"];
  }
  if (normalized.includes("int") || normalized.includes("inter")) {
    return ["Intermédiaire", "Intermediaire", "IntermÃ©diaire", "Intermediate"];
  }
  if (normalized.includes("adv") || normalized.includes("ava")) {
    return ["Avancé", "Avance", "AvancÃ©", "Advanced"];
  }
  return [value, "Intermédiaire", "Intermediaire", "Intermediate"];
}

function buildLegacyPlayerValueCandidates(registration: RegistrationRow): PlayerLegacyValueSet[] {
  const sexeCandidates = getSexCandidates(asText(registration.sexe));
  const posteCandidates = getPosteCandidates(asText(registration.poste_jeu));
  const niveauCandidates = getNiveauCandidates(asText(registration.niveau_jeu));

  const result: PlayerLegacyValueSet[] = [];
  const seen = new Set<string>();

  for (const sexe of sexeCandidates) {
    for (const poste of posteCandidates) {
      for (const niveau of niveauCandidates) {
        const key = `${sexe}|${poste}|${niveau}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ sexe, poste, niveau });
      }
    }
  }

  return result;
}

function splitFullName(fullName: string): { prenom: string; nom: string } {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "Player", nom: "Badgers" };
  if (parts.length === 1) return { prenom: parts[0], nom: "Badgers" };
  return {
    prenom: parts[0],
    nom: parts.slice(1).join(" "),
  };
}

function buildReadableRegistrationReference(registration: RegistrationRow): string {
  const explicitReference = asText(registration.registration_id);
  if (explicitReference && !isUuid(explicitReference)) return explicitReference;

  const fullName = asText(registration.nom_complet);
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.slice(0, 2).toUpperCase())
      .join("")
      .slice(0, 6) || "PL";

  const rawReferenceId =
    (explicitReference && isUuid(explicitReference) ? explicitReference : asText(registration.id)) || "";
  const idChunk = rawReferenceId.replaceAll("-", "").slice(0, 6).toUpperCase() || "000000";
  return `FBCA-${initials}-${idChunk}`;
}

function normalizePublicBaseUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.protocol.startsWith("http")) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function resolvePublicSiteUrl(requestOrigin: string | null): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL ?? "",
    process.env.NEXT_PUBLIC_APP_URL ?? "",
    process.env.SITE_URL ?? "",
    requestOrigin ?? "",
    "https://floridabadgersfca.com",
  ];

  for (const candidate of candidates) {
    const normalized = normalizePublicBaseUrl(candidate);
    if (normalized) return normalized;
  }

  return "https://floridabadgersfca.com";
}

function asNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function isMissingColumnError(error: { code?: string; message?: string } | null, columnName: string): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("column") && message.includes(columnName.toLowerCase());
}

function shouldRetryPlayerInsert(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "23514") return true;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("check constraint") ||
    message.includes("joueurs_niveau_check") ||
    message.includes("joueurs_poste_check") ||
    message.includes("joueurs_sexe_check")
  );
}

async function getNextJerseyNumber(supabase: ReturnType<typeof createSupabaseServiceClient>): Promise<number> {
  const { data, error } = await supabase
    .from("joueurs")
    .select("dossard")
    .not("dossard", "is", null)
    .order("dossard", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const currentMax = asNumberOrNull(data?.dossard) ?? 0;
  return Math.max(1, currentMax + 1);
}

async function linkRegistrationToPlayerIfPossible(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  table: RegistrationTableName,
  registrationId: string,
  playerId: string
): Promise<void> {
  const { error } = await supabase.from(table).update({ player_id: playerId }).eq("id", registrationId);
  if (error && !isMissingColumnError(error, "player_id")) {
    throw new Error(error.message);
  }
}

async function promoteRegistrationToPlayer(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  table: RegistrationTableName,
  registration: RegistrationRow
): Promise<PromotionResult> {
  const linkedPlayerId = asText(registration.player_id);
  if (isUuid(linkedPlayerId)) {
    const { data: linkedPlayer, error: linkedPlayerError } = await supabase
      .from("joueurs")
      .select("id, dossard")
      .eq("id", linkedPlayerId)
      .maybeSingle();

    if (linkedPlayerError) {
      throw new Error(linkedPlayerError.message);
    }

    if (linkedPlayer?.id) {
      return {
        playerId: linkedPlayer.id,
        dossard: asNumberOrNull(linkedPlayer.dossard),
        createdNow: false,
      };
    }
  }

  const fullName = asText(registration.nom_complet);
  if (!fullName) {
    throw new Error("Cannot create player: missing full name.");
  }

  const { prenom, nom } = splitFullName(fullName);
  const birthDate = asText(registration.date_naissance) || null;

  if (birthDate) {
    const { data: existingPlayer, error: existingPlayerError } = await supabase
      .from("joueurs")
      .select("id, dossard")
      .eq("prenom", prenom)
      .eq("nom", nom)
      .eq("date_naissance", birthDate)
      .maybeSingle();

    if (existingPlayerError) {
      throw new Error(existingPlayerError.message);
    }

    if (existingPlayer?.id) {
      await linkRegistrationToPlayerIfPossible(supabase, table, registration.id, existingPlayer.id);
      return {
        playerId: existingPlayer.id,
        dossard: asNumberOrNull(existingPlayer.dossard),
        createdNow: false,
      };
    }
  }

  const dossard = await getNextJerseyNumber(supabase);
  const basePlayerPayload = {
    nom,
    prenom,
    photo_url: asText(registration.photo_url) || null,
    date_naissance: birthDate,
    age: asNumberOrNull(registration.age),
    sexe: normalizeSex(asText(registration.sexe)) ?? "Masculin",
    categorie_id: isUuid(asText(registration.categorie_id)) ? asText(registration.categorie_id) : null,
    poste: normalizePoste(asText(registration.poste_jeu)) ?? "Milieu",
    niveau: normalizeNiveau(asText(registration.niveau_jeu)) ?? "Intermédiaire",
    dossard,
    is_active: true,
  };

  const legacyCandidates = buildLegacyPlayerValueCandidates(registration);
  const insertCandidates: PlayerLegacyValueSet[] = [];
  const seen = new Set<string>();

  const addCandidate = (candidate: PlayerLegacyValueSet) => {
    const key = `${candidate.sexe}|${candidate.poste}|${candidate.niveau}`;
    if (seen.has(key)) return;
    seen.add(key);
    insertCandidates.push(candidate);
  };

  addCandidate({
    sexe: String(basePlayerPayload.sexe),
    poste: String(basePlayerPayload.poste),
    niveau: String(basePlayerPayload.niveau),
  });

  for (const legacyCandidate of legacyCandidates) {
    addCandidate(legacyCandidate);
  }

  let createdPlayer: { id: string; dossard: number | null } | null = null;
  let lastInsertError: { message?: string } | null = null;

  for (const candidate of insertCandidates) {
    const { data: insertedPlayer, error: insertError } = await supabase
      .from("joueurs")
      .insert({
        ...basePlayerPayload,
        sexe: candidate.sexe,
        poste: candidate.poste,
        niveau: candidate.niveau,
      })
      .select("id, dossard")
      .single();

    if (!insertError && insertedPlayer?.id) {
      createdPlayer = insertedPlayer;
      break;
    }

    if (!shouldRetryPlayerInsert(insertError)) {
      throw new Error(insertError?.message ?? "Failed to create player.");
    }

    lastInsertError = insertError;
  }

  if (!createdPlayer) {
    throw new Error(lastInsertError?.message ?? "Failed to create player after legacy fallback attempts.");
  }

  await linkRegistrationToPlayerIfPossible(supabase, table, registration.id, createdPlayer.id);

  return {
    playerId: createdPlayer.id,
    dossard: asNumberOrNull(createdPlayer.dossard),
    createdNow: true,
  };
}

async function sendRegistrationDecisionEmail(
  registration: RegistrationRow,
  nextStatus: RegistrationStatus,
  siteUrl: string
): Promise<void> {
  const receiver = asText(registration.email);
  if (!isEmail(receiver)) return;

  const fullName = asText(registration.nom_complet) || "Player";
  const reference = buildReadableRegistrationReference(registration);
  const mailer = createClubMailerContext();

  if (nextStatus === "accepte") {
    const html = renderClubBrandedEmail({
      logoHtml: mailer.logoHtml,
      bannerTitle: "Registration Accepted",
      bannerSubtitle: "Welcome to Florida Badgers FCA.",
      greeting: `Hello ${fullName},`,
      referenceLabel: "Registration ID",
      referenceValue: reference,
      contentHtml: `
        <p style="margin:0 0 14px 0;">
          Your registration has been accepted. You are now added to the club player list.
        </p>
        <p style="margin:0 0 8px 0;">
          Junior program fees: <strong>$150</strong> registration (equipment included) and <strong>$50/month</strong>.
        </p>
        <p style="margin:0;">
          Our staff will contact you for the next steps and training details.
        </p>
      `,
    });

    await mailer.transporter.sendMail({
      from: mailer.fromWithName,
      to: receiver,
      subject: `Registration Accepted - ${reference}`,
      html,
      attachments: mailer.attachments,
    });
    return;
  }

  if (nextStatus === "refuse") {
    const notAcceptedUrl = `${siteUrl}/join/not-accepted?registration=${encodeURIComponent(reference)}`;
    const html = renderClubBrandedEmail({
      logoHtml: mailer.logoHtml,
      bannerTitle: "Registration Not Accepted",
      bannerSubtitle: "Status update from Florida Badgers FCA.",
      greeting: `Hello ${fullName},`,
      referenceLabel: "Registration ID",
      referenceValue: reference,
      contentHtml: `
        <p style="margin:0 0 14px 0;">
          After review, your registration is currently not accepted.
        </p>
        <p style="margin:0 0 14px 0;">
          You can contact the club for feedback or future tryout opportunities.
        </p>
        <p style="margin:0;">
          <a
            href="${notAcceptedUrl}"
            style="display:inline-block;padding:11px 18px;background:#000000;color:#ffffff;text-decoration:none;font-weight:700;border-radius:4px;"
          >
            View Next Steps
          </a>
        </p>
      `,
    });

    await mailer.transporter.sendMail({
      from: mailer.fromWithName,
      to: receiver,
      subject: `Registration Update - ${reference}`,
      html,
      attachments: mailer.attachments,
    });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ table: string; id: string }> }
) {
  const auth = await requireApiUserWithUser(request);
  if (auth.response) return auth.response;
  const authenticatedUser = auth.user;

  const { table, id } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  const role = normalizeDashboardRole(authenticatedUser?.role);
  const isAdmin = role === "admin";

  if (!canAccessDashboardTable(role, table)) {
    return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
  }

  // Security: Non-admins can only edit THEIR OWN user record
  if (table === "users" && !isAdmin && authenticatedUser.id !== id) {
    return NextResponse.json({ error: "Forbidden: You can only manage your own profile." }, { status: 403 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid row id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeTablePayload(table, body, "update");
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid fields supplied." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const requestProto = asText(request.headers.get("x-forwarded-proto"));
    const requestHost = asText(request.headers.get("x-forwarded-host")) || asText(request.headers.get("host"));
    const requestOrigin = requestProto && requestHost ? `${requestProto}://${requestHost}` : null;
    const publicSiteUrl = resolvePublicSiteUrl(requestOrigin);
    let previousRegistrationStatus: RegistrationStatus | null = null;

    if (isRegistrationTable(table) && payload.statut !== undefined) {
      const { data: previousRow, error: previousRowError } = await supabase
        .from(config.table)
        .select("statut")
        .eq("id", id)
        .maybeSingle();

      if (previousRowError) {
        return NextResponse.json({ error: previousRowError.message }, { status: 400 });
      }

      previousRegistrationStatus = canonicalizeRegistrationStatus(previousRow?.statut);
    }

    if (table === "actualites" && payload.is_published === true) {
      const { data: currentArticle, error: currentArticleError } = await supabase
        .from(config.table)
        .select("is_published, auteur_id")
        .eq("id", id)
        .maybeSingle();

      if (currentArticleError) {
        return NextResponse.json({ error: currentArticleError.message }, { status: 400 });
      }

      const shouldAssignAuthor =
        !currentArticle || currentArticle.is_published !== true || !currentArticle.auteur_id;

      if (shouldAssignAuthor) {
        payload.auteur_id = await resolveArticleAuthorId(supabase, authenticatedUser.email);
      }
    }

    // Custom logic for users table (Supabase Auth integration)
    if (table === "users") {
      const email = body.email !== undefined ? String(body.email || "").trim().toLowerCase() : undefined;
      const password = body.password !== undefined ? String(body.password || "").trim() : undefined;
      const confirmPassword = body.confirm_password !== undefined ? String(body.confirm_password || "").trim() : undefined;

      const supabase = createSupabaseServiceClient();
      const updateData: any = {};

      if (email !== undefined) updateData.email = email;
      
      if (password !== undefined) {
        if (password) {
          if (password !== confirmPassword) {
            return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
          }
          updateData.password = password;
        }
      }

      // Update Auth user if needed
      if (Object.keys(updateData).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(id, {
          ...updateData,
          user_metadata: {
            full_name: payload.full_name || undefined,
            role: payload.role || undefined
          }
        });

        if (authError) {
          return NextResponse.json({ error: `Auth Update Error: ${authError.message}` }, { status: 400 });
        }
      }

      // Remove transient fields
      for (const field of config.createFields) {
        if (field.transient) {
          delete payload[field.key];
        }
      }
    }

    const { data, error } = await supabase
      .from(config.table)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Don't return password in response
    if (data && "password" in data) {
      delete (data as any).password;
    }

    let responseData = data as Record<string, unknown>;
    if (isRegistrationTable(table)) {
      const updatedRegistration = data as RegistrationRow;
      const nextStatus = canonicalizeRegistrationStatus(updatedRegistration.statut);

      let promotion: PromotionResult | null = null;
      if (nextStatus === "accepte") {
        promotion = await promoteRegistrationToPlayer(supabase, table, updatedRegistration);
        responseData = {
          ...responseData,
          player_id: promotion.playerId,
          promoted_to_player: true,
          assigned_dossard: promotion.dossard,
        };
      }

      if (
        nextStatus &&
        nextStatus !== previousRegistrationStatus &&
        (nextStatus === "accepte" || nextStatus === "refuse")
      ) {
        try {
          await sendRegistrationDecisionEmail(updatedRegistration, nextStatus, publicSiteUrl);
        } catch (mailError) {
          console.error("[registration-status-email] Failed to send status email", mailError);
        }
      }
    }

    if (table === "paiements") {
      const [enrichedPaymentRow] = await enrichPaymentRowsWithRegistrationDetails(supabase, [responseData]);
      if (enrichedPaymentRow) {
        responseData = enrichedPaymentRow;
      }
    }

    return NextResponse.json({ data: responseData }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ table: string; id: string }> }
) {
  const auth = await requireApiUserWithUser(request);
  if (auth.response) return auth.response;
  const user = auth.user;

  const { table, id } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  const role = normalizeDashboardRole(user?.role);
  const isAdmin = role === "admin";

  if (!canAccessDashboardTable(role, table)) {
    return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
  }

  // Security: Non-admins CANNOT delete users (even themselves via API for safety)
  if (table === "users" && !isAdmin) {
    return NextResponse.json({ error: "Forbidden: Only admins can delete users." }, { status: 403 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid row id." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceClient();

    // If deleting from users table, also delete from Supabase Auth
    if (table === "users") {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) {
        console.error(`[delete-user] Failed to delete auth user ${id}:`, authError.message);
        // We continue anyway to try and delete the DB record
      }
    }

    const { error } = await supabase.from(config.table).delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

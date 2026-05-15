import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { trackSiteEvent } from "@/lib/analytics/events";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

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
  captchaToken?: string;
};

type LegacyValueSet = {
  sexe: string;
  poste_jeu: string;
  niveau_jeu: string;
};

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

function shouldFallbackToLegacy(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "23514") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("categorie_id") || msg.includes("check constraint");
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
  return [
    mapLegacyWithAccents(input),
    {
      sexe: input.sexe,
      poste_jeu: input.poste_jeu,
      niveau_jeu: input.niveau_jeu,
    },
    mapLegacyMojibake(input),
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RegistrationInput>;

    const captchaResult = await verifyRecaptchaToken(body.captchaToken);
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error || "CAPTCHA verification failed." }, { status: 403 });
    }

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

    // Generate shorter custom Registration ID: FBCA-[INITIALS]-[SHORTID]
    const nameParts = normalizeText(body.nom_complet).split(/\s+/);
    const initials = nameParts.map(part => part.substring(0, 2).toUpperCase()).join("");
    const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const customRegId = `FBCA-${initials}-${shortId}`;

    const legacyCandidate = mapLegacyWithAccents(body as RegistrationInput);

    const payload = {
      programme_inscription: body.programme_inscription,
      nom_complet: normalizeText(body.nom_complet),
      date_naissance: body.date_naissance,
      age,
      sexe: legacyCandidate.sexe,
      adresse: normalizeText(body.adresse),
      telephone: normalizeText(body.telephone),
      email: normalizeText(body.email),
      photo_url: normalizeText(body.photo_url) || null,
      poste_jeu: legacyCandidate.poste_jeu,
      niveau_jeu: legacyCandidate.niveau_jeu,
      club_actuel: normalizeText(body.club_actuel) || null,
      experience_football: normalizeText(body.experience_football) || null,
      categorie_id: body.categorie_id,
      categorie_age: category.nom, // Use the real category name (U5-U23)
      registration_id: customRegId, // New field
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

    const targetTable = isStageRegistration ? "inscriptions_stage" : "inscriptions_joueurs";

    const { data, error } = await supabase
      .from(targetTable)
      .insert(payload)
      .select("id, created_at, statut")
      .single();

    if (!error) {
      await trackSiteEvent({
        eventType: "registration_submitted",
        path: "/join",
        source: "registration-api",
        metadata: {
          registrationId: data.id,
          targetTable,
          programme: body.programme_inscription,
        },
      });

      return NextResponse.json({ success: true, registration: data }, { status: 201 });
    }

    if (isStageRegistration) {
      return NextResponse.json(
        {
          error:
            error.message ??
            "Tryout registration failed. Ensure the 'inscriptions_stage' table exists and migrations are applied.",
        },
        { status: 500 }
      );
    }

    if (!shouldFallbackToLegacy(error)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    const legacyCandidates = buildLegacyValueCandidates(body as RegistrationInput);

    for (const candidate of legacyCandidates) {
      const legacyPayload = {
        nom_complet: normalizeText(body.nom_complet),
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
        categorie_age: category.nom,
        registration_id: customRegId,
        probleme_sante: Boolean(body.probleme_sante),
        probleme_sante_details: normalizeText(body.probleme_sante_details) || null,
        allergies_connues: normalizeText(body.allergies_connues) || null,
        nom_parent_tuteur: parentName || null,
        telephone_parent_tuteur: parentPhone || null,
        autorisation_parentale: Boolean(body.autorisation_parentale),
        accepte_regles_stage: Boolean(body.accepte_regles_stage),
        confirme_infos_correctes: Boolean(body.confirme_infos_correctes),
        waiver_accepted: Boolean(body.waiver_accepted),
        signature_nom: normalizeText(body.signature_nom) || null,
        signature_date: body.signature_date || null,
        signature_parent_nom: normalizeText(body.signature_parent_nom) || null,
        signature_parent_date: body.signature_parent_date || null,
      };

      const legacyInsert = await supabase
        .from("inscriptions_joueurs")
        .insert(legacyPayload)
        .select("id, created_at, statut")
        .single();

      if (!legacyInsert.error) {
        await trackSiteEvent({
          eventType: "registration_submitted",
          path: "/join",
          source: "registration-api",
          metadata: {
            registrationId: legacyInsert.data.id,
            targetTable: "inscriptions_joueurs",
            programme: body.programme_inscription,
            legacySchema: true,
          },
        });

        return NextResponse.json({ success: true, registration: legacyInsert.data, legacy: true }, { status: 201 });
      }
    }

    return NextResponse.json(
      { error: "Registration failed on both modern and legacy schema paths." },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

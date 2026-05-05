import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type RegistrationInput = {
  nom_complet: string;
  date_naissance: string;
  sexe: "Masculin" | "Feminin";
  adresse: string;
  telephone: string;
  email: string;
  photo_url?: string | null;
  poste_jeu: "Gardien" | "Defenseur" | "Milieu" | "Attaquant";
  niveau_jeu: "Debutant" | "Intermediaire" | "Avance";
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
};

type LegacyValueSet = {
  sexe: string;
  poste_jeu: string;
  niveau_jeu: string;
};

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
  if (error.code === "42703") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("categorie_id");
}

function mapLegacyWithAccents(input: RegistrationInput): LegacyValueSet {
  return {
    sexe: input.sexe === "Feminin" ? "F\u00E9minin" : "Masculin",
    poste_jeu: input.poste_jeu === "Defenseur" ? "D\u00E9fenseur" : input.poste_jeu,
    niveau_jeu:
      input.niveau_jeu === "Debutant"
        ? "D\u00E9butant"
        : input.niveau_jeu === "Intermediaire"
        ? "Interm\u00E9diaire"
        : input.niveau_jeu === "Avance"
        ? "Avanc\u00E9"
        : input.niveau_jeu,
  };
}

function mapLegacyMojibake(input: RegistrationInput): LegacyValueSet {
  return {
    sexe: input.sexe === "Feminin" ? "Féminin" : "Masculin",
    poste_jeu: input.poste_jeu === "Defenseur" ? "Défenseur" : input.poste_jeu,
    niveau_jeu:
      input.niveau_jeu === "Debutant"
        ? "Débutant"
        : input.niveau_jeu === "Intermediaire"
        ? "Intermédiaire"
        : input.niveau_jeu === "Avance"
        ? "Avancé"
        : input.niveau_jeu,
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

    const requiredFields = [
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

    if (!isUuid(body.categorie_id as string)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const age = calculateAge(body.date_naissance as string);
    if (Number.isNaN(age) || age < 6 || age > 60) {
      return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
    }

    const isMinor = age < 18;
    const parentName = normalizeText(body.nom_parent_tuteur);
    const parentPhone = normalizeText(body.telephone_parent_tuteur);
    if (isMinor && (!parentName || !parentPhone || body.autorisation_parentale !== true)) {
      return NextResponse.json(
        { error: "For minors, parent/tutor info and parental authorization are required." },
        { status: 400 }
      );
    }

    const payload = {
      nom_complet: normalizeText(body.nom_complet),
      date_naissance: body.date_naissance,
      age,
      sexe: body.sexe,
      adresse: normalizeText(body.adresse),
      telephone: normalizeText(body.telephone),
      email: normalizeText(body.email),
      photo_url: normalizeText(body.photo_url) || null,
      poste_jeu: body.poste_jeu,
      niveau_jeu: body.niveau_jeu,
      club_actuel: normalizeText(body.club_actuel) || null,
      experience_football: normalizeText(body.experience_football) || null,
      categorie_id: body.categorie_id,
      inscrit_par: body.inscrit_par,
      relation_avec_joueur: normalizeText(body.relation_avec_joueur) || null,
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
    };

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("inscriptions_joueurs")
      .insert(payload)
      .select("id, created_at, statut")
      .single();

    if (!error) {
      return NextResponse.json({ success: true, registration: data }, { status: 201 });
    }

    if (!shouldFallbackToLegacy(error)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("nom")
      .eq("id", body.categorie_id as string)
      .maybeSingle();

    if (categoryError || !category?.nom) {
      return NextResponse.json(
        { error: categoryError?.message ?? "Unable to resolve category for legacy schema fallback." },
        { status: 500 }
      );
    }

    const emergencySummary = JSON.stringify({
      nom: normalizeText(body.contact_urgence_nom),
      telephone: normalizeText(body.contact_urgence_telephone),
      relation: normalizeText(body.contact_urgence_relation),
      email: normalizeText(body.contact_urgence_email) || null,
      adresse: normalizeText(body.contact_urgence_adresse) || null,
      consentement_soins_urgence: Boolean(body.consentement_soins_urgence),
    });

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
        probleme_sante: Boolean(body.probleme_sante),
        probleme_sante_details: normalizeText(body.probleme_sante_details) || null,
        allergies_connues: normalizeText(body.allergies_connues) || null,
        nom_parent_tuteur: parentName || null,
        telephone_parent_tuteur: parentPhone || null,
        autorisation_parentale: Boolean(body.autorisation_parentale),
        accepte_regles_stage: Boolean(body.accepte_regles_stage),
        confirme_infos_correctes: Boolean(body.confirme_infos_correctes),
        note_admin: `urgence:${emergencySummary}`,
      };

      const legacyInsert = await supabase
        .from("inscriptions_joueurs")
        .insert(legacyPayload)
        .select("id, created_at, statut")
        .single();

      if (!legacyInsert.error) {
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

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronLeft, ShieldAlert, UserCheck } from "lucide-react";



// Add photo_url to RegistrationForm
type RegistrationForm = {
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
  photo_url?: string; // new field for uploaded photo URL
  poste_jeu: "Goalkeeper" | "Defender" | "Midfielder" | "Forward" | "Gardien" | "Defenseur" | "Milieu" | "Attaquant";
  niveau_jeu: "Beginner" | "Intermediate" | "Advanced" | "Debutant" | "Intermediaire" | "Avance";
  stage_periode: "weekend" | "holiday_camp" | "evening_sessions";
  stage_objectif: "technique" | "tactique" | "preparation_physique" | "gardien";
  club_actuel: string;
  experience_football: string;
  categorie_id: string;
  inscrit_par: "parent_tuteur" | "joueur";
  relation_avec_joueur: string;
  probleme_sante: boolean;
  probleme_sante_details: string;
  allergies_connues: string;
  contact_urgence_nom: string;
  contact_urgence_telephone: string;
  contact_urgence_relation: string;
  contact_urgence_email: string;
  contact_urgence_adresse: string;
  nom_parent_tuteur: string;
  telephone_parent_tuteur: string;
  autorisation_parentale: boolean;
  consentement_soins_urgence: boolean;
  accepte_regles_stage: boolean;
  confirme_infos_correctes: boolean;
  waiver_accepted: boolean;
  signature_nom: string;
  signature_date: string;
  signature_parent_nom: string;
  signature_parent_date: string;
};

type Category = {
  id: string;
  nom: string;
  description: string | null;
};



const steps = [
  { title: "Player", subtitle: "Personal information" },
  { title: "Football", subtitle: "Sport profile and category" },
  { title: "Health & Emergency", subtitle: "Medical and emergency contact" },
  { title: "Waiver", subtitle: "Liability release and signature" },
  { title: "Parent Consent", subtitle: "Required for minors" },
  { title: "Review", subtitle: "Confirm and submit" },
];

const REGISTRATION_PROGRAMS: Array<{
  value: RegistrationForm["programme_inscription"];
  label: string;
  description: string;
}> = [
  {
    value: "junior_foundation",
    label: "Club Registration",
    description: "A parent/guardian can register a player, or the player can register directly.",
  },
  {
    value: "stage_english",
    label: "Tryout Registration",
    description: "A single tryout form with tryout-specific fields.",
  },
];

const REGISTRATION_PROGRAM_BADGES: Record<RegistrationForm["programme_inscription"], string> = {
  junior_foundation: "Club",
  junior_development: "Club",
  junior_elite: "Club",
  stage_english: "Tryout",
};

const STAGE_PERIODES: Array<{ value: RegistrationForm["stage_periode"]; label: string }> = [
  { value: "weekend", label: "Weekend Session" },
  { value: "holiday_camp", label: "Holiday Camp Session" },
  { value: "evening_sessions", label: "Evening Session" },
];

const STAGE_OBJECTIFS: Array<{ value: RegistrationForm["stage_objectif"]; label: string }> = [
  { value: "technique", label: "Technical Development" },
  { value: "tactique", label: "Tactical Understanding" },
  { value: "preparation_physique", label: "Physical Preparation" },
  { value: "gardien", label: "Goalkeeper Focus" },
];

const initialForm: RegistrationForm = {
  programme_inscription: "junior_foundation",
  nom_complet: "",
  date_naissance: "",
  sexe: "Male",
  adresse: "",
  telephone: "",
  email: "",
  poste_jeu: "Midfielder",
  niveau_jeu: "Intermediate",
  stage_periode: "weekend",
  stage_objectif: "technique",
  club_actuel: "",
  experience_football: "",
  categorie_id: "",
  inscrit_par: "parent_tuteur",
  relation_avec_joueur: "",
  probleme_sante: false,
  probleme_sante_details: "",
  allergies_connues: "",
  contact_urgence_nom: "",
  contact_urgence_telephone: "",
  contact_urgence_relation: "",
  contact_urgence_email: "",
  contact_urgence_adresse: "",
  nom_parent_tuteur: "",
  telephone_parent_tuteur: "",
  autorisation_parentale: false,
  consentement_soins_urgence: false,
  accepte_regles_stage: false,
  confirme_infos_correctes: false,
  waiver_accepted: false,
  signature_nom: "",
  signature_date: new Date().toISOString().split('T')[0],
  signature_parent_nom: "",
  signature_parent_date: new Date().toISOString().split('T')[0],
};

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">{children}</label>;
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={`w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 ${className}`}
    />
  );
}

function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string; children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-500 ${className}`}
    >
      {children}
    </select>
  );
}

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return (
    <textarea
      {...props}
      className={`w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 resize-y ${className}`}
    />
  );
}

export default function JoinPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Handle file selection
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }

  // Upload helper
  async function uploadPhoto(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const resp = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error ?? 'Photo upload failed');
    }
    return data.url;
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);


  const age = useMemo(() => calculateAge(form.date_naissance), [form.date_naissance]);
  const { minBirthDate, maxBirthDate } = useMemo(() => {
    const today = new Date();
    const youngestAllowed = new Date(today);
    youngestAllowed.setFullYear(today.getFullYear() - 5);
    const oldestAllowed = new Date(today);
    oldestAllowed.setFullYear(today.getFullYear() - 40);

    return {
      minBirthDate: formatDateForInput(oldestAllowed),
      maxBirthDate: formatDateForInput(youngestAllowed),
    };
  }, []);
  const isMinor = typeof age === "number" && age < 18;
  const isStageRegistration = form.programme_inscription === "stage_english";
  const availableCategories = useMemo(() => {
    if (isStageRegistration) {
      return categories;
    }
    return categories.filter(
      (category) => !/(18|plus|senior)/i.test(`${category.nom} ${category.description ?? ""}`)
    );
  }, [categories, isStageRegistration]);
  const selectedCategoryId = useMemo(() => {
    if (availableCategories.length === 0) return "";
    return availableCategories.some((category) => category.id === form.categorie_id)
      ? form.categorie_id
      : availableCategories[0].id;
  }, [availableCategories, form.categorie_id]);
  const stageAutoCategory = useMemo(() => {
    if (!age || !isStageRegistration || categories.length === 0) {
      return null;
    }

    const matchByPattern = (pattern: RegExp) =>
      categories.find((category) => pattern.test(`${category.nom} ${category.description ?? ""}`));

    if (age <= 5) return matchByPattern(/u5|\b5\b/i) ?? null;
    if (age <= 7) return matchByPattern(/u7|\b6\b|\b7\b/i) ?? null;
    if (age <= 9) return matchByPattern(/u9|\b8\b|\b9\b/i) ?? null;
    if (age <= 11) return matchByPattern(/u11|\b10\b|\b11\b/i) ?? null;
    if (age <= 13) return matchByPattern(/u13|\b12\b|\b13\b/i) ?? null;
    if (age <= 15) return matchByPattern(/u15|\b14\b|\b15\b/i) ?? null;
    if (age <= 17) return matchByPattern(/u17|\b16\b|\b17\b/i) ?? null;
    return matchByPattern(/18|senior|plus|adult/i) ?? null;
  }, [age, categories, isStageRegistration]);
  const resolvedCategoryId = isStageRegistration
    ? stageAutoCategory?.id ?? selectedCategoryId
    : selectedCategoryId;
  const resolvedCategoryLabel = useMemo(() => {
    const found = categories.find((category) => category.id === resolvedCategoryId);
    return found?.nom ?? "-";
  }, [categories, resolvedCategoryId]);
  const displaySteps = useMemo(
    () =>
      steps.map((item, index) => {
        if (index === 1 && isStageRegistration) {
          return { ...item, title: "Tryout Profile", subtitle: "Program objective and level" };
        }
        if (index === 4 && !isMinor) {
          return { ...item, title: "Consent", subtitle: "Adult consent and emergency approval" };
        }
        return item;
      }),
    [isMinor, isStageRegistration]
  );

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const response = await fetch("/api/categories", { cache: "no-store" });
        const payload = (await response.json()) as { data?: Category[]; error?: string };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "Unable to load categories");
        }
        const loadedCategories = payload.data;
        if (active) {
          setCategories(loadedCategories);
          if (loadedCategories.length > 0) {
            setForm((prev) => ({ ...prev, categorie_id: prev.categorie_id || loadedCategories[0].id }));
          }
        }
      } catch (error) {
        if (active) setCategoryError(error instanceof Error ? error.message : "Unable to load categories");
      } finally {
        if (active) setLoadingCategories(false);
      }
    }
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectProgram(program: RegistrationForm["programme_inscription"]) {
    setForm((prev) => ({
      ...prev,
      programme_inscription: program,
      inscrit_par: "parent_tuteur",
      relation_avec_joueur: "",
    }));
    setStep(0);
    setFormError("");
  }

  function validateCurrentStep(currentStep: number): string | null {
    if (currentStep === 0) {
      if (!form.nom_complet.trim()) return "Full name is required.";
      if (!form.date_naissance) return "Date of birth is required.";
      if (!form.adresse.trim()) return "Address is required.";
      if (!form.telephone.trim()) return "Phone number is required.";
      if (!form.email.trim()) return "Email is required.";
      if (!age || age < 5 || age > 40) return "Date of birth is invalid for registration (allowed range: 5 to 40 years).";
    }
    if (currentStep === 1) {
      if (!resolvedCategoryId) return "Please choose a category.";
      if (isStageRegistration) {
        if (!form.stage_periode) return "Please choose a tryout period.";
        if (!form.stage_objectif) return "Please choose a tryout objective.";
      }
    }
    if (currentStep === 2) {
      if (!form.contact_urgence_nom.trim()) return "Emergency contact name is required.";
      if (!form.contact_urgence_telephone.trim()) return "Emergency contact phone is required.";
      if (!form.contact_urgence_relation.trim()) return "Emergency contact relation is required.";
    }
    if (currentStep === 3) {
      if (!form.waiver_accepted) return "You must read and accept the waiver.";
      if (isMinor) {
        if (!form.signature_parent_nom.trim()) return "Parent/Guardian name is required for signature.";
      } else {
        if (!form.signature_nom.trim()) return "Participant name is required for signature.";
      }
    }
    if (currentStep === 4 && isMinor) {
      if (!form.nom_parent_tuteur.trim()) return "Parent/tutor name is required for minors.";
      if (!form.telephone_parent_tuteur.trim()) return "Parent/tutor phone is required for minors.";
      if (!form.autorisation_parentale) return "Parental authorization is required for minors.";
    }
    if (currentStep === 5) {
      if (!form.consentement_soins_urgence) return "Emergency care consent is required.";
      if (!form.accepte_regles_stage) {
        return isStageRegistration ? "You must accept tryout rules." : "You must accept club rules.";
      }
      if (!form.confirme_infos_correctes) return "You must confirm all information is correct.";
    }
    return null;
  }

  function nextStep() {
    const validationError = validateCurrentStep(step);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function previousStep() {
    setFormError("");
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function submitForm() {
    let uploadedPhotoUrl: string | undefined = undefined;

    // 1. Upload photo if selected
    if (photoFile) {
      setUploadingPhoto(true);
      try {
        const url = await uploadPhoto(photoFile);
        uploadedPhotoUrl = url;
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Photo upload failed");
        setUploadingPhoto(false);
        return;
      }
      setUploadingPhoto(false);
    }

    // 2. Validate final step
    const validationError = validateCurrentStep(5);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      // 3. Construct payload
      const payload = {
        ...form,
        programme_inscription: form.programme_inscription,
        categorie_id: resolvedCategoryId,
        nom_complet: form.nom_complet.trim(),
        adresse: form.adresse.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim(),
        club_actuel: form.club_actuel.trim() || null,
        experience_football: form.experience_football.trim() || null,
        relation_avec_joueur: isMinor ? form.relation_avec_joueur.trim() || null : null,
        probleme_sante_details: form.probleme_sante_details.trim() || null,
        allergies_connues: form.allergies_connues.trim() || null,
        contact_urgence_nom: form.contact_urgence_nom.trim(),
        contact_urgence_telephone: form.contact_urgence_telephone.trim(),
        contact_urgence_relation: form.contact_urgence_relation.trim(),
        contact_urgence_email: form.contact_urgence_email.trim() || null,
        contact_urgence_adresse: form.contact_urgence_adresse.trim() || null,
        inscrit_par: isMinor ? form.inscrit_par : "joueur",
        nom_parent_tuteur: isMinor ? form.nom_parent_tuteur.trim() || null : null,
        telephone_parent_tuteur: isMinor ? form.telephone_parent_tuteur.trim() || null : null,
        autorisation_parentale: isMinor ? form.autorisation_parentale : false,
        photo_url: uploadedPhotoUrl,
        waiver_accepted: form.waiver_accepted,
        signature_nom: form.signature_nom,
        signature_date: form.signature_date,
        signature_parent_nom: form.signature_parent_nom,
        signature_parent_date: form.signature_parent_date,
      };

      // 4. Submit to registrations API
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { error?: string; registration?: { id: string } };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to submit registration.");
      }

      setSuccessMessage("Registration sent successfully!");
      setForm(initialForm);
      setPhotoFile(null);
      setPhotoPreview(null);
      setStep(0);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unexpected error while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-slate-100 min-h-screen">
      <section className="relative overflow-hidden bg-slate-900 text-white px-6 xl:px-10 pt-32 pb-20">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #1e3a5f 0, transparent 35%), radial-gradient(circle at 80% 70%, #ffffff 0, transparent 30%)" }} />
        <div className="relative max-w-[1320px] mx-auto">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-white/70 mb-3">Register</div>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[1.02]">
            {isStageRegistration ? "Tryout Registration" : "Club Registration"}
          </h1>
          <p className="mt-4 text-white/75 max-w-2xl leading-relaxed">
            {isStageRegistration
              ? "Complete the tryout registration form."
              : "Complete the club registration form. Parent details are required for minors."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {isStageRegistration ? "Tryout Form" : "Junior Form"}
            </span>
            <span className="inline-flex items-center border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {typeof age === "number" ? (isMinor ? "Minor Player" : "Adult Player") : "Age Pending"}
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 py-12">
        <div className="max-w-[1320px] mx-auto grid xl:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-white border border-slate-200 p-5 h-fit">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Progress</div>
            <div className="space-y-3">
              {displaySteps.map((item, index) => {
                const done = index < step;
                const active = index === step;
                return (
                  <div
                    key={item.title}
                    className={`border px-3 py-3 transition-colors ${
                      active
                        ? "border-[#1e3a5f] bg-slate-50"
                        : done
                        ? "border-slate-300 bg-white"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 flex items-center justify-center text-[11px] font-black ${
                          active
                            ? "bg-[#1e3a5f] text-white"
                            : done
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {done ? <CheckCircle2 size={14} /> : index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-black uppercase tracking-wider text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Selected Program</div>
              <div className="text-sm font-black uppercase tracking-wide text-slate-900">
                {REGISTRATION_PROGRAMS.find((program) => program.value === form.programme_inscription)?.label ?? "-"}
              </div>
              <div className="mt-2 text-xs text-slate-600 leading-relaxed">
                {REGISTRATION_PROGRAMS.find((program) => program.value === form.programme_inscription)?.description}
              </div>
            </div>
          </aside>

          <article className="bg-white border border-slate-200 p-5 sm:p-7">
            <div className="mb-7 border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Choose Registration Type</div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-3">
                {REGISTRATION_PROGRAMS.map((program) => {
                  const selected = form.programme_inscription === program.value;
                  const badge = REGISTRATION_PROGRAM_BADGES[program.value];
                  const stage = program.value === "stage_english";
                  return (
                    <button
                      key={program.value}
                      type="button"
                      onClick={() => selectProgram(program.value)}
                      className={`text-left border p-4 transition-all ${
                        selected
                          ? "border-[#1e3a5f] bg-white shadow-[0_0_0_1px_rgba(30,58,95,0.15)]"
                          : "border-slate-200 bg-white hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            stage ? "bg-slate-900 text-white" : "bg-[#1e3a5f] text-white"
                          }`}
                        >
                          {badge}
                        </span>
                        {selected && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#1e3a5f]">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-black uppercase tracking-wide text-slate-900">{program.label}</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-600">
                Parent/guardian and player can both use the club form. Tryout has one separate form.
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                {step === 0 && (
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">Player Information</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <div className="border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Selected Type</div>
                          <div className="text-sm font-black uppercase tracking-wide text-slate-900">
                            {REGISTRATION_PROGRAMS.find((program) => program.value === form.programme_inscription)?.label}
                          </div>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Full Name</FieldLabel>
                        <Input value={form.nom_complet} onChange={(e) => update("nom_complet", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel>Date of Birth</FieldLabel>
                        <Input
                          type="date"
                          min={minBirthDate}
                          max={maxBirthDate}
                          value={form.date_naissance}
                          onChange={(e) => update("date_naissance", e.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>Sex</FieldLabel>
                        <Select value={form.sexe} onChange={(e) => update("sexe", e.target.value as RegistrationForm["sexe"])}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Address</FieldLabel>
                        <Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} />
                      </div>
                      {/* Photo Upload */}
                      <div className="sm:col-span-2 border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Player Photo</div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#1e3a5f] file:text-white hover:file:bg-[#374151]"
                        />
                        {photoPreview && (
                          <div className="relative mt-2 h-48 w-full max-w-sm overflow-hidden rounded-lg border border-slate-200">
                            <Image
                              src={photoPreview}
                              alt="Preview"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        )}
                        {uploadingPhoto && <p className="mt-1 text-xs text-[#1e3a5f] animate-pulse">Uploading...</p>}
                      </div>
                      <div>
                        <FieldLabel>Phone</FieldLabel>
                        <Input value={form.telephone} onChange={(e) => update("telephone", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel>Email</FieldLabel>
                        <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-slate-500">Calculated age: <span className="font-semibold text-slate-800">{age ?? "-"}</span></div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">
                      {isStageRegistration ? "Tryout Profile" : "Club Profile"}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Position</FieldLabel>
                        <Select value={form.poste_jeu} onChange={(e) => update("poste_jeu", e.target.value as RegistrationForm["poste_jeu"])}>
                          <option value="Goalkeeper">Goalkeeper</option>
                          <option value="Defender">Defender</option>
                          <option value="Midfielder">Midfielder</option>
                          <option value="Forward">Forward</option>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Level</FieldLabel>
                        <Select value={form.niveau_jeu} onChange={(e) => update("niveau_jeu", e.target.value as RegistrationForm["niveau_jeu"])}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Current Club</FieldLabel>
                        <Input value={form.club_actuel} onChange={(e) => update("club_actuel", e.target.value)} />
                      </div>
                      {isStageRegistration ? (
                        <>
                          <div>
                            <FieldLabel>Tryout Period</FieldLabel>
                            <Select
                              value={form.stage_periode}
                              onChange={(e) => update("stage_periode", e.target.value as RegistrationForm["stage_periode"])}
                            >
                              {STAGE_PERIODES.map((stagePeriod) => (
                                <option key={stagePeriod.value} value={stagePeriod.value}>
                                  {stagePeriod.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <FieldLabel>Tryout Objective</FieldLabel>
                            <Select
                              value={form.stage_objectif}
                              onChange={(e) => update("stage_objectif", e.target.value as RegistrationForm["stage_objectif"])}
                            >
                              {STAGE_OBJECTIFS.map((objectif) => (
                                <option key={objectif.value} value={objectif.value}>
                                  {objectif.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="sm:col-span-2 border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            Tryout group is assigned automatically from player age:{" "}
                            <span className="font-bold text-slate-900">{resolvedCategoryLabel}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {isMinor ? (
                            <>
                              <div>
                                <FieldLabel>Registered By</FieldLabel>
                                <Select
                                  value={form.inscrit_par}
                                  onChange={(e) => update("inscrit_par", e.target.value as RegistrationForm["inscrit_par"])}
                                >
                                  <option value="parent_tuteur">Parent / Guardian</option>
                                  <option value="joueur">Player</option>
                                </Select>
                              </div>
                              <div className="sm:col-span-2">
                                <FieldLabel>Relation with player (if parent/tutor)</FieldLabel>
                                <Input value={form.relation_avec_joueur} onChange={(e) => update("relation_avec_joueur", e.target.value)} />
                              </div>
                            </>
                          ) : (
                            <div className="sm:col-span-2 border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                              Adult registration: parent/tutor options are removed.
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <FieldLabel>Category</FieldLabel>
                            {loadingCategories ? (
                              <div className="border border-slate-300 px-4 py-3 text-sm text-slate-500">Loading categories...</div>
                            ) : categoryError ? (
                              <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{categoryError}</div>
                            ) : (
                              <Select
                                value={selectedCategoryId}
                                onChange={(e) => update("categorie_id", e.target.value)}
                              >
                                {availableCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.nom}
                                  </option>
                                ))}
                              </Select>
                            )}
                          </div>
                        </>
                      )}
                      <div className="sm:col-span-2">
                        <FieldLabel>Football Experience</FieldLabel>
                        <Textarea rows={5} value={form.experience_football} onChange={(e) => update("experience_football", e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">Health & Emergency</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 flex items-center gap-3 border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          id="healthIssue"
                          type="checkbox"
                          checked={form.probleme_sante}
                          onChange={(e) => update("probleme_sante", e.target.checked)}
                          className="h-4 w-4 accent-[#1e3a5f]"
                        />
                        <label htmlFor="healthIssue" className="text-sm text-slate-800">Player has a health issue</label>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Health Details</FieldLabel>
                        <Textarea rows={4} value={form.probleme_sante_details} onChange={(e) => update("probleme_sante_details", e.target.value)} />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Known Allergies</FieldLabel>
                        <Input value={form.allergies_connues} onChange={(e) => update("allergies_connues", e.target.value)} />
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">Emergency Contact</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Emergency Contact Name</FieldLabel>
                          <Input value={form.contact_urgence_nom} onChange={(e) => update("contact_urgence_nom", e.target.value)} />
                        </div>
                        <div>
                          <FieldLabel>Emergency Contact Phone</FieldLabel>
                          <Input value={form.contact_urgence_telephone} onChange={(e) => update("contact_urgence_telephone", e.target.value)} />
                        </div>
                        <div>
                          <FieldLabel>Relation</FieldLabel>
                          <Input value={form.contact_urgence_relation} onChange={(e) => update("contact_urgence_relation", e.target.value)} />
                        </div>
                        <div>
                          <FieldLabel>Emergency Contact Email</FieldLabel>
                          <Input type="email" value={form.contact_urgence_email} onChange={(e) => update("contact_urgence_email", e.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Emergency Contact Address</FieldLabel>
                          <Input value={form.contact_urgence_adresse} onChange={(e) => update("contact_urgence_adresse", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">Waiver & Release</h2>
                    <div className="border border-slate-200 bg-white p-4 mb-6 max-h-[400px] overflow-y-auto text-sm text-slate-700 leading-relaxed space-y-4">
                      <p className="font-bold uppercase underline">AMATEUR ATHLETIC WAIVER AND RELEASE OF LIABILITY</p>
                      <p className="font-bold underline">READ BEFORE SIGNING</p>
                      <p>
                        In consideration of being allowed to participate in any way in <strong>(Sharks FCA Of Florida and city of Boynton beach Florida)</strong> soccer league, related events and activities, the undersigned acknowledges, appreciates, and agrees that:
                      </p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>
                          The risks of injury and illness (ex: communicable diseases such as MRSA, influenza, and COVID-19) from the activities involved in this program are significant, including the potential for permanent paralysis and death, and while particular rules, equipment, and personal discipline may reduce these risks, the risks of serious injury and illness do exist; and,
                        </li>
                        <li>
                          I KNOWINGLY AND FREELY ASSUME ALL SUCH RISKS, both known and unknown, EVEN IF ARISING FROM THE NEGLIGENCE OF THE RELEASEES or others, and assume full responsibility for my participation; and,
                        </li>
                        <li>
                          I willingly agree to comply with the stated and customary terms and conditions for participation. If, however, I observe any unusual significant hazard during my presence or participation, I will remove myself from participation and bring such to the attention of the nearest official immediately; and,
                        </li>
                        <li>
                          I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, HEREBY RELEASE AND HOLD HARMLESS <strong>(Sharks FCA Of Florida and city of Boynton beach Florida)</strong> their officers, officials, agents, and/or employees, other participants, sponsoring agencies, sponsors, advertisers, and if applicable, owners and lessors of premises used to conduct the event (&quot;RELEASEES&quot;), WITH RESPECT TO ANY AND ALL INJURY, ILLNESS, DISABILITY, DEATH, or loss or damage to person or property, WHETHER ARISING FROM THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, to the fullest extent permitted by law.
                        </li>
                      </ol>
                      <p className="font-bold uppercase">
                        I HAVE READ THIS RELEASE OF LIABILITY AND ASSUMPTION OF RISK AGREEMENT, FULLY UNDERSTAND ITS TERMS, UNDERSTAND THAT I HAVE GIVEN UP SUBSTANTIAL RIGHTS BY SIGNING IT, AND SIGN IT FREELY AND VOLUNTARILY WITHOUT ANY INDUCEMENT.
                      </p>

                      {isMinor && (
                        <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                          <p className="font-bold uppercase">FOR PARTICIPANTS OF MINORITY AGE (UNDER AGE 18 AT THE TIME OF REGISTRATION)</p>
                          <p>
                            This is to certify that I, as parent/guardian with legal responsibility for this participant, have read and explained the provisions in this waiver/release to my child/ward including the risks of the activity and his/her responsibilities for adhering to the rules and regulations. Furthermore, my child/ward understands and accepts these risks and responsibilities. I for myself, my spouse, and child/ward do consent and agree to his/her release provided above for all the Releasees and myself, my spouse, and child/ward do release and agree to indemnify and hold harmless the Releasees from any and all liabilities incident to my minor child&apos;s/ward&apos;s involvement or participation in these activities as provided above, EVEN IF ARISING FROM THEIR NEGLIGENCE, to the fullest extent permitted by law.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.waiver_accepted}
                          onChange={(e) => update("waiver_accepted", e.target.checked)}
                          className="h-4 w-4 mt-0.5 accent-[#1e3a5f]"
                        />
                        <span>I have read and accept the terms of the Waiver and Release of Liability.</span>
                      </label>

                      {isMinor ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <FieldLabel>Parent/Guardian Printed Name (Signature)</FieldLabel>
                            <Input
                              value={form.signature_parent_nom}
                              onChange={(e) => update("signature_parent_nom", e.target.value)}
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <FieldLabel>Date Signed</FieldLabel>
                            <Input
                              type="date"
                              value={form.signature_parent_date}
                              readOnly
                              className="bg-slate-50 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <FieldLabel>Participant Printed Name (Signature)</FieldLabel>
                            <Input
                              value={form.signature_nom}
                              onChange={(e) => update("signature_nom", e.target.value)}
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <FieldLabel>Date Signed</FieldLabel>
                            <Input
                              type="date"
                              value={form.signature_date}
                              readOnly
                              className="bg-slate-50 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">
                      {isMinor ? "Parent Consent" : "Consent & Authorization"}
                    </h2>
                    <div className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4 mb-6">
                      <ShieldAlert size={18} className="text-[#1e3a5f] mt-0.5" />
                      <p className="text-sm text-slate-700">
                        {isMinor
                          ? "This player is a minor. Parent/tutor details and parental authorization are mandatory."
                          : "Player is 18+. Parent/tutor fields are removed automatically."}
                      </p>
                    </div>

                    {isMinor && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Parent / Tutor Name</FieldLabel>
                          <Input value={form.nom_parent_tuteur} onChange={(e) => update("nom_parent_tuteur", e.target.value)} />
                        </div>
                        <div>
                          <FieldLabel>Parent / Tutor Phone</FieldLabel>
                          <Input value={form.telephone_parent_tuteur} onChange={(e) => update("telephone_parent_tuteur", e.target.value)} />
                        </div>
                      </div>
                    )}

                    <div className="mt-6 space-y-3">
                      {isMinor && (
                        <label className="flex items-start gap-3 border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={form.autorisation_parentale}
                            onChange={(e) => update("autorisation_parentale", e.target.checked)}
                            className="h-4 w-4 mt-0.5 accent-[#1e3a5f]"
                          />
                          I authorize the player to register and participate in club activities.
                        </label>
                      )}
                      <label className="flex items-start gap-3 border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.consentement_soins_urgence}
                          onChange={(e) => update("consentement_soins_urgence", e.target.checked)}
                          className="h-4 w-4 mt-0.5 accent-[#1e3a5f]"
                        />
                        I authorize emergency medical care if needed.
                      </label>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">Review & Submit</h2>
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Program</div>
                        <div className="font-bold text-slate-900">
                          {REGISTRATION_PROGRAMS.find((program) => program.value === form.programme_inscription)?.label ?? "-"}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {isStageRegistration ? "Tryout form (English)" : "Junior club form"}
                        </div>
                      </div>
                      <div className="border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Player</div>
                        <div className="font-bold text-slate-900">{form.nom_complet || "-"}</div>
                        <div className="text-sm text-slate-600 mt-1">{form.email || "-"}</div>
                        <div className="text-sm text-slate-600">{form.telephone || "-"}</div>
                      </div>
                      <div className="border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Football</div>
                        <div className="font-bold text-slate-900">{form.poste_jeu} - {form.niveau_jeu}</div>
                        <div className="text-sm text-slate-600 mt-1">Age: {age ?? "-"}</div>
                        <div className="text-sm text-slate-600">Category: {resolvedCategoryLabel}</div>
                        {isStageRegistration && (
                          <>
                            <div className="text-sm text-slate-600 mt-1">
                              Tryout period: {STAGE_PERIODES.find((period) => period.value === form.stage_periode)?.label ?? "-"}
                            </div>
                            <div className="text-sm text-slate-600">
                              Tryout objective: {STAGE_OBJECTIFS.find((objectif) => objectif.value === form.stage_objectif)?.label ?? "-"}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Emergency</div>
                        <div className="font-bold text-slate-900">{form.contact_urgence_nom || "-"}</div>
                        <div className="text-sm text-slate-600 mt-1">{form.contact_urgence_telephone || "-"}</div>
                        <div className="text-sm text-slate-600">{form.contact_urgence_relation || "-"}</div>
                      </div>
                      <div className="border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Signature</div>
                        <div className="font-bold text-slate-900">
                          {isMinor ? form.signature_parent_nom : form.signature_nom}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          Date: {isMinor ? form.signature_parent_date : form.signature_date}
                        </div>
                        <div className="text-xs text-[#1e3a5f] mt-1 font-bold">Waiver Accepted</div>
                      </div>
                      {isMinor ? (
                        <div className="border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Parent</div>
                          <div className="font-bold text-slate-900">{form.nom_parent_tuteur || "-"}</div>
                          <div className="text-sm text-slate-600 mt-1">{form.telephone_parent_tuteur || "-"}</div>
                          <div className="text-sm text-slate-600">Minor registration</div>
                        </div>
                      ) : (
                        <div className="border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Parent</div>
                          <div className="font-bold text-slate-900">Not required</div>
                          <div className="text-sm text-slate-600 mt-1">Adult registration</div>
                        </div>
                      )}
                    </div>


                    <div className="space-y-3">
                      <label className="flex items-start gap-3 border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.accepte_regles_stage}
                          onChange={(e) => update("accepte_regles_stage", e.target.checked)}
                          className="h-4 w-4 mt-0.5 accent-[#1e3a5f]"
                        />
                        {isStageRegistration
                          ? "I accept tryout rules and participation guidelines."
                          : "I accept club rules and training guidelines."}
                      </label>
                      <label className="flex items-start gap-3 border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.confirme_infos_correctes}
                          onChange={(e) => update("confirme_infos_correctes", e.target.checked)}
                          className="h-4 w-4 mt-0.5 accent-[#1e3a5f]"
                        />
                        I confirm all provided information is accurate.
                      </label>
                    </div>

                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {(formError || successMessage) && (
              <div
                className={`mt-6 border px-4 py-3 text-sm ${
                  formError ? "border-red-300 bg-red-50 text-red-700" : "border-sky-300 bg-sky-50 text-sky-700"
                }`}
              >
                {formError || successMessage}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={previousStep}
                disabled={step === 0 || submitting}
                className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-500 transition-colors"
              >
                <ChevronLeft size={15} /> Back
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={submitting || loadingCategories}
                  className="inline-flex items-center gap-2 bg-[#1e3a5f] px-5 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitForm}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-[#1e3a5f] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Registration"} <UserCheck size={15} />
                </button>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

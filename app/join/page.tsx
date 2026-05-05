"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronLeft, ShieldAlert, UserCheck } from "lucide-react";

type Category = {
  id: string;
  nom: string;
  description: string | null;
};

type RegistrationForm = {
  nom_complet: string;
  date_naissance: string;
  sexe: "Masculin" | "Feminin";
  adresse: string;
  telephone: string;
  email: string;
  poste_jeu: "Gardien" | "Defenseur" | "Milieu" | "Attaquant";
  niveau_jeu: "Debutant" | "Intermediaire" | "Avance";
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
};

const steps = [
  { title: "Player", subtitle: "Personal information" },
  { title: "Football", subtitle: "Sport profile and category" },
  { title: "Health & Emergency", subtitle: "Medical and emergency contact" },
  { title: "Parent Consent", subtitle: "Required for minors" },
  { title: "Review", subtitle: "Confirm and submit" },
];

const initialForm: RegistrationForm = {
  nom_complet: "",
  date_naissance: "",
  sexe: "Masculin",
  adresse: "",
  telephone: "",
  email: "",
  poste_jeu: "Milieu",
  niveau_jeu: "Intermediaire",
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const age = useMemo(() => calculateAge(form.date_naissance), [form.date_naissance]);
  const isMinor = typeof age === "number" && age < 18;

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

  function validateCurrentStep(currentStep: number): string | null {
    if (currentStep === 0) {
      if (!form.nom_complet.trim()) return "Full name is required.";
      if (!form.date_naissance) return "Date of birth is required.";
      if (!form.adresse.trim()) return "Address is required.";
      if (!form.telephone.trim()) return "Phone number is required.";
      if (!form.email.trim()) return "Email is required.";
      if (!age || age < 6 || age > 60) return "Date of birth is invalid for registration.";
    }
    if (currentStep === 1) {
      if (!form.categorie_id) return "Please choose a category.";
    }
    if (currentStep === 2) {
      if (!form.contact_urgence_nom.trim()) return "Emergency contact name is required.";
      if (!form.contact_urgence_telephone.trim()) return "Emergency contact phone is required.";
      if (!form.contact_urgence_relation.trim()) return "Emergency contact relation is required.";
    }
    if (currentStep === 3 && isMinor) {
      if (!form.nom_parent_tuteur.trim()) return "Parent/tutor name is required for minors.";
      if (!form.telephone_parent_tuteur.trim()) return "Parent/tutor phone is required for minors.";
      if (!form.autorisation_parentale) return "Parental authorization is required for minors.";
    }
    if (currentStep === 4) {
      if (!form.consentement_soins_urgence) return "Emergency care consent is required.";
      if (!form.accepte_regles_stage) return "You must accept club rules.";
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
    const validationError = validateCurrentStep(4);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const payload = {
        ...form,
        nom_complet: form.nom_complet.trim(),
        adresse: form.adresse.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim(),
        club_actuel: form.club_actuel.trim() || null,
        experience_football: form.experience_football.trim() || null,
        relation_avec_joueur: form.relation_avec_joueur.trim() || null,
        probleme_sante_details: form.probleme_sante_details.trim() || null,
        allergies_connues: form.allergies_connues.trim() || null,
        contact_urgence_nom: form.contact_urgence_nom.trim(),
        contact_urgence_telephone: form.contact_urgence_telephone.trim(),
        contact_urgence_relation: form.contact_urgence_relation.trim(),
        contact_urgence_email: form.contact_urgence_email.trim() || null,
        contact_urgence_adresse: form.contact_urgence_adresse.trim() || null,
        nom_parent_tuteur: form.nom_parent_tuteur.trim() || null,
        telephone_parent_tuteur: form.telephone_parent_tuteur.trim() || null,
      };

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { error?: string; registration?: { id: string } };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to submit registration.");
      }

      setSuccessMessage(
        `Registration sent successfully. Reference ID: ${result.registration?.id ?? "pending"}`
      );
      setForm(initialForm);
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
            Junior Registration
          </h1>
          <p className="mt-4 text-white/75 max-w-2xl leading-relaxed">
            Complete the step-by-step form to register a player. Parent category selection and emergency contact are included.
          </p>
        </div>
      </section>

      <section className="px-6 xl:px-10 py-12">
        <div className="max-w-[1320px] mx-auto grid xl:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-white border border-slate-200 p-5 h-fit">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Progress</div>
            <div className="space-y-3">
              {steps.map((item, index) => {
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
          </aside>

          <article className="bg-white border border-slate-200 p-5 sm:p-7">
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
                        <FieldLabel>Full Name</FieldLabel>
                        <Input value={form.nom_complet} onChange={(e) => update("nom_complet", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel>Date of Birth</FieldLabel>
                        <Input type="date" value={form.date_naissance} onChange={(e) => update("date_naissance", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel>Sex</FieldLabel>
                        <Select value={form.sexe} onChange={(e) => update("sexe", e.target.value as RegistrationForm["sexe"])}>
                          <option value="Masculin">Masculin</option>
                          <option value="Feminin">Feminin</option>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Address</FieldLabel>
                        <Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} />
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
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">Football Profile</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Position</FieldLabel>
                        <Select value={form.poste_jeu} onChange={(e) => update("poste_jeu", e.target.value as RegistrationForm["poste_jeu"])}>
                          <option value="Gardien">Gardien</option>
                          <option value="Defenseur">Defenseur</option>
                          <option value="Milieu">Milieu</option>
                          <option value="Attaquant">Attaquant</option>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Level</FieldLabel>
                        <Select value={form.niveau_jeu} onChange={(e) => update("niveau_jeu", e.target.value as RegistrationForm["niveau_jeu"])}>
                          <option value="Debutant">Debutant</option>
                          <option value="Intermediaire">Intermediaire</option>
                          <option value="Avance">Avance</option>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Current Club</FieldLabel>
                        <Input value={form.club_actuel} onChange={(e) => update("club_actuel", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel>Registered By</FieldLabel>
                        <Select
                          value={form.inscrit_par}
                          onChange={(e) => update("inscrit_par", e.target.value as RegistrationForm["inscrit_par"])}
                        >
                          <option value="parent_tuteur">Parent / Tuteur</option>
                          <option value="joueur">Joueur</option>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Relation with player (if parent/tutor)</FieldLabel>
                        <Input value={form.relation_avec_joueur} onChange={(e) => update("relation_avec_joueur", e.target.value)} />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Category</FieldLabel>
                        {loadingCategories ? (
                          <div className="border border-slate-300 px-4 py-3 text-sm text-slate-500">Loading categories...</div>
                        ) : categoryError ? (
                          <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{categoryError}</div>
                        ) : (
                          <Select
                            value={form.categorie_id}
                            onChange={(e) => update("categorie_id", e.target.value)}
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.nom}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>
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
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">Parent Consent</h2>
                    <div className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4 mb-6">
                      <ShieldAlert size={18} className="text-[#1e3a5f] mt-0.5" />
                      <p className="text-sm text-slate-700">
                        {isMinor
                          ? "This player is a minor. Parent/tutor details and parental authorization are mandatory."
                          : "Player is 18+. Parent/tutor details are optional but recommended."}
                      </p>
                    </div>

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

                    <div className="mt-6 space-y-3">
                      <label className="flex items-start gap-3 border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.autorisation_parentale}
                          onChange={(e) => update("autorisation_parentale", e.target.checked)}
                          className="h-4 w-4 mt-0.5 accent-[#1e3a5f]"
                        />
                        I authorize the player to register and participate in club activities.
                      </label>
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

                {step === 4 && (
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-5">Review & Submit</h2>
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
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
                        <div className="text-sm text-slate-600">
                          Category: {categories.find((c) => c.id === form.categorie_id)?.nom ?? "-"}
                        </div>
                      </div>
                      <div className="border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Emergency</div>
                        <div className="font-bold text-slate-900">{form.contact_urgence_nom || "-"}</div>
                        <div className="text-sm text-slate-600 mt-1">{form.contact_urgence_telephone || "-"}</div>
                        <div className="text-sm text-slate-600">{form.contact_urgence_relation || "-"}</div>
                      </div>
                      <div className="border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Parent</div>
                        <div className="font-bold text-slate-900">{form.nom_parent_tuteur || "-"}</div>
                        <div className="text-sm text-slate-600 mt-1">{form.telephone_parent_tuteur || "-"}</div>
                        <div className="text-sm text-slate-600">{isMinor ? "Minor registration" : "Adult registration"}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-start gap-3 border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.accepte_regles_stage}
                          onChange={(e) => update("accepte_regles_stage", e.target.checked)}
                          className="h-4 w-4 mt-0.5 accent-[#1e3a5f]"
                        />
                        I accept club rules and training guidelines.
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

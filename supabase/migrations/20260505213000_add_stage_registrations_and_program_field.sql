-- Add program tracking to junior registrations
alter table if exists inscriptions_joueurs
  add column if not exists programme_inscription text default 'junior_foundation';

update inscriptions_joueurs
set programme_inscription = coalesce(programme_inscription, 'junior_foundation')
where programme_inscription is null;

alter table inscriptions_joueurs
  alter column programme_inscription set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_inscriptions_programme_inscription'
  ) then
    alter table inscriptions_joueurs
      add constraint chk_inscriptions_programme_inscription
      check (
        programme_inscription in (
          'junior_foundation',
          'junior_development',
          'junior_elite',
          'stage_english'
        )
      );
  end if;
end $$;

-- Stage registrations (same structure as junior flow, isolated table)
create table if not exists inscriptions_stage (
  id uuid primary key default gen_random_uuid(),
  programme_inscription text not null default 'stage_english'
    check (programme_inscription = 'stage_english'),

  -- Section 1: Informations personnelles
  nom_complet text not null,
  date_naissance date not null,
  age int not null check (age between 6 and 60),
  sexe text not null check (sexe in ('Masculin', 'Feminin')),
  adresse text not null,
  telephone text not null,
  email text not null,
  photo_url text,

  -- Section 2: Informations sportives
  poste_jeu text not null check (poste_jeu in ('Gardien', 'Defenseur', 'Milieu', 'Attaquant')),
  niveau_jeu text not null check (niveau_jeu in ('Debutant', 'Intermediaire', 'Avance')),
  club_actuel text,
  experience_football text,
  categorie_id uuid not null references categories(id) on delete restrict,
  inscrit_par text not null default 'joueur' check (inscrit_par in ('parent_tuteur', 'joueur')),
  relation_avec_joueur text,

  -- Section 3: Informations medicales
  probleme_sante boolean not null default false,
  probleme_sante_details text,
  allergies_connues text,

  -- Section 4: Contact d'urgence
  contact_urgence_nom text not null,
  contact_urgence_telephone text not null,
  contact_urgence_relation text not null,
  contact_urgence_email text,
  contact_urgence_adresse text,

  -- Section 5: Parent/tuteur (mineurs uniquement)
  nom_parent_tuteur text,
  telephone_parent_tuteur text,
  autorisation_parentale boolean default false,
  consentement_soins_urgence boolean not null default false,

  -- Section 6: Engagement
  accepte_regles_stage boolean not null default false,
  confirme_infos_correctes boolean not null default false,

  -- Suivi interne
  statut text default 'en_attente' check (statut in ('en_attente', 'accepte', 'refuse')),
  created_at timestamptz default now(),

  constraint chk_stage_parent_info_for_minors
    check (
      age >= 18
      or (
        nom_parent_tuteur is not null
        and telephone_parent_tuteur is not null
        and autorisation_parentale = true
      )
    ),
  constraint chk_stage_contact_urgence_non_vide
    check (
      length(btrim(contact_urgence_nom)) > 0
      and length(btrim(contact_urgence_telephone)) > 0
      and length(btrim(contact_urgence_relation)) > 0
    )
);

create index if not exists idx_stage_registrations_created_at
  on inscriptions_stage(created_at desc);

create index if not exists idx_stage_registrations_statut
  on inscriptions_stage(statut);

create index if not exists idx_stage_registrations_categorie
  on inscriptions_stage(categorie_id);

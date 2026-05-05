create extension if not exists "pgcrypto";

-- =========================
-- USERS
-- =========================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role text default 'user' check (role in ('admin', 'player', 'user')),
  photo_url text,
  created_at timestamptz default now()
);

-- =========================
-- ACTUALITES
-- =========================
create table if not exists actualites (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  sous_titre text,
  photo_url text,
  description text not null,
  auteur_id uuid references users(id) on delete set null,
  is_published boolean default true,
  created_at timestamptz default now()
);

-- =========================
-- CATEGORIES
-- =========================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  description text,
  created_at timestamptz default now()
);

insert into categories (nom, description)
values
  ('8-10 ans', 'Categorie pour les joueurs de 8 a 10 ans'),
  ('11-13 ans', 'Categorie pour les joueurs de 11 a 13 ans'),
  ('14-17 ans', 'Categorie pour les joueurs de 14 a 17 ans'),
  ('18 ans et plus', 'Categorie senior')
on conflict (nom) do nothing;

-- =========================
-- JOUEURS AFFICHES SUR LE SITE
-- =========================
create table if not exists joueurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  nom_complet text generated always as (prenom || ' ' || nom) stored,
  photo_url text,
  date_naissance date,
  age int,
  sexe text check (sexe in ('Masculin', 'Feminin')),
  categorie_id uuid references categories(id) on delete set null,
  poste text check (poste in ('Gardien', 'Defenseur', 'Milieu', 'Attaquant')),
  niveau text check (niveau in ('Debutant', 'Intermediaire', 'Avance')),
  dossard int,
  taille text,
  poids text,
  nationalite text,
  bio text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- =========================
-- INSCRIPTION JOUEURS (REGISTER)
-- Junior-friendly: categorie choisie par parent
-- + contact d'urgence obligatoire
-- =========================
create table if not exists inscriptions_joueurs (
  id uuid primary key default gen_random_uuid(),

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

  -- Section 3: Categorie d'age (choix parent via liste categories)
  categorie_id uuid not null references categories(id) on delete restrict,
  inscrit_par text not null default 'parent_tuteur' check (inscrit_par in ('parent_tuteur', 'joueur')),
  relation_avec_joueur text,

  -- Section 4: Informations medicales
  probleme_sante boolean not null default false,
  probleme_sante_details text,
  allergies_connues text,

  -- Section 5: Contact d'urgence (obligatoire)
  contact_urgence_nom text not null,
  contact_urgence_telephone text not null,
  contact_urgence_relation text not null,
  contact_urgence_email text,
  contact_urgence_adresse text,

  -- Section 6: Autorisation parentale (mineurs)
  nom_parent_tuteur text,
  telephone_parent_tuteur text,
  autorisation_parentale boolean default false,
  consentement_soins_urgence boolean not null default false,

  -- Section 7: Engagement
  accepte_regles_stage boolean not null default false,
  confirme_infos_correctes boolean not null default false,

  -- Gestion admin
  statut text default 'en_attente' check (statut in ('en_attente', 'accepte', 'refuse')),
  note_admin text,
  created_at timestamptz default now(),

  constraint chk_parent_info_for_minors
    check (
      age >= 18
      or (
        nom_parent_tuteur is not null
        and telephone_parent_tuteur is not null
        and autorisation_parentale = true
      )
    ),
  constraint chk_contact_urgence_non_vide
    check (
      length(btrim(contact_urgence_nom)) > 0
      and length(btrim(contact_urgence_telephone)) > 0
      and length(btrim(contact_urgence_relation)) > 0
    )
);

-- Compatibilite si la table existait deja avec l'ancien schema
alter table inscriptions_joueurs
  add column if not exists categorie_id uuid references categories(id) on delete restrict,
  add column if not exists inscrit_par text default 'parent_tuteur',
  add column if not exists relation_avec_joueur text,
  add column if not exists contact_urgence_nom text,
  add column if not exists contact_urgence_telephone text,
  add column if not exists contact_urgence_relation text,
  add column if not exists contact_urgence_email text,
  add column if not exists contact_urgence_adresse text,
  add column if not exists consentement_soins_urgence boolean default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'inscriptions_joueurs'
      and column_name = 'categorie_age'
  ) then
    update inscriptions_joueurs ij
    set categorie_id = c.id
    from categories c
    where ij.categorie_id is null
      and ij.categorie_age = c.nom;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_parent_info_for_minors'
  ) then
    alter table inscriptions_joueurs
      add constraint chk_parent_info_for_minors
      check (
        age >= 18
        or (
          nom_parent_tuteur is not null
          and telephone_parent_tuteur is not null
          and autorisation_parentale = true
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_contact_urgence_non_vide'
  ) then
    alter table inscriptions_joueurs
      add constraint chk_contact_urgence_non_vide
      check (
        coalesce(length(btrim(contact_urgence_nom)), 0) > 0
        and coalesce(length(btrim(contact_urgence_telephone)), 0) > 0
        and coalesce(length(btrim(contact_urgence_relation)), 0) > 0
      );
  end if;
end $$;

-- =========================
-- MATCHS
-- =========================
create table if not exists matchs (
  id uuid primary key default gen_random_uuid(),
  equipe_domicile text not null,
  logo_domicile_url text,
  equipe_exterieur text not null,
  logo_exterieur_url text,
  score_domicile int default 0,
  score_exterieur int default 0,
  date_match timestamptz not null,
  stade text,
  competition text,
  statut text default 'a_venir' check (statut in ('a_venir', 'en_cours', 'termine')),
  minute_match int default 0,
  created_at timestamptz default now()
);

-- =========================
-- INDEX POUR PERFORMANCE
-- =========================
create index if not exists idx_actualites_created_at on actualites(created_at desc);
create index if not exists idx_joueurs_categorie on joueurs(categorie_id);
create index if not exists idx_inscriptions_statut on inscriptions_joueurs(statut);
create index if not exists idx_inscriptions_categorie on inscriptions_joueurs(categorie_id);
create index if not exists idx_matchs_date on matchs(date_match desc);

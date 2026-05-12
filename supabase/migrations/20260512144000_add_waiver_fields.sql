-- Add waiver and signature fields to registrations
alter table if exists inscriptions_joueurs
  add column if not exists waiver_accepted boolean default false,
  add column if not exists signature_nom text,
  add column if not exists signature_date date,
  add column if not exists signature_parent_nom text,
  add column if not exists signature_parent_date date;

alter table if exists inscriptions_stage
  add column if not exists waiver_accepted boolean default false,
  add column if not exists signature_nom text,
  add column if not exists signature_date date,
  add column if not exists signature_parent_nom text,
  add column if not exists signature_parent_date date;

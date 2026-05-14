-- Add registration_id column to inscriptions tables
alter table if exists inscriptions_joueurs
  add column if not exists registration_id text;

alter table if exists inscriptions_stage
  add column if not exists registration_id text;

-- Link accepted registrations to created players for idempotent promotion.
alter table if exists inscriptions_joueurs
  add column if not exists player_id uuid references joueurs(id) on delete set null;

alter table if exists inscriptions_stage
  add column if not exists player_id uuid references joueurs(id) on delete set null;

create index if not exists idx_inscriptions_joueurs_player_id
  on inscriptions_joueurs(player_id);

create index if not exists idx_inscriptions_stage_player_id
  on inscriptions_stage(player_id);

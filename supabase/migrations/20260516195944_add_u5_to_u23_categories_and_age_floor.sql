-- Add official age categories from U5 to U23.
-- Keep this idempotent to avoid duplicate/conflicting inserts.
insert into categories (nom, description)
values
  ('U5', 'Under 5 category'),
  ('U7', 'Under 7 category'),
  ('U9', 'Under 9 category'),
  ('U11', 'Under 11 category'),
  ('U13', 'Under 13 category'),
  ('U15', 'Under 15 category'),
  ('U17', 'Under 17 category'),
  ('U19', 'Under 19 category'),
  ('U21', 'Under 21 category'),
  ('U23', 'Under 23 category')
on conflict (nom) do update
set description = excluded.description;

-- Align DB age checks with site behavior (U5 is valid).
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.inscriptions_joueurs'::regclass
      and conname = 'inscriptions_joueurs_age_check'
  ) then
    alter table public.inscriptions_joueurs
      drop constraint inscriptions_joueurs_age_check;
  end if;

  alter table public.inscriptions_joueurs
    add constraint inscriptions_joueurs_age_check
    check (age between 5 and 60);
exception
  when duplicate_object then
    null;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.inscriptions_stage'::regclass
      and conname = 'inscriptions_stage_age_check'
  ) then
    alter table public.inscriptions_stage
      drop constraint inscriptions_stage_age_check;
  end if;

  alter table public.inscriptions_stage
    add constraint inscriptions_stage_age_check
    check (age between 5 and 60);
exception
  when undefined_table then
    null;
  when duplicate_object then
    null;
end $$;

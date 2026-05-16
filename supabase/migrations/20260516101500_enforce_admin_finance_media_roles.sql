-- Enforce public.users role set to admin / finance / media only.
do $$
declare
  existing_constraint record;
begin
  if to_regclass('public.users') is null then
    return;
  end if;

  -- Drop the canonical role check first (if already present).
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_role_check'
  ) then
    alter table public.users drop constraint users_role_check;
  end if;

  for existing_constraint in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.users'::regclass
      and c.contype = 'c'
      and c.conname <> 'users_role_check'
      and pg_get_constraintdef(c.oid) ~* '\mrole\M'
  loop
    execute format('alter table public.users drop constraint %I', existing_constraint.conname);
  end loop;

  update public.users
  set role = case
    when lower(coalesce(role, '')) = 'admin' then 'admin'
    when lower(coalesce(role, '')) = 'finance' then 'finance'
    when lower(coalesce(role, '')) = 'media' then 'media'
    else 'media'
  end;

  alter table public.users
    alter column role set default 'media';

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check
      check (role in ('admin', 'finance', 'media'));
  end if;
end $$;

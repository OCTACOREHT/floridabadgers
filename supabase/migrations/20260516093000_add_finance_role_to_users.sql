-- Restrict public.users role values to admin / finance / media.
do $$
declare
  existing_constraint record;
begin
  if to_regclass('public.users') is null then
    return;
  end if;

  -- Drop previous role check constraints (legacy or auto-named).
  for existing_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.users'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role in (%'
  loop
    execute format('alter table public.users drop constraint %I', existing_constraint.conname);
  end loop;

  -- Normalize legacy roles before applying the new check.
  update public.users
  set role = case
    when lower(coalesce(role, '')) = 'admin' then 'admin'
    when lower(coalesce(role, '')) = 'finance' then 'finance'
    else 'media'
  end;

  alter table public.users
    alter column role set default 'media';

  alter table public.users
    add constraint users_role_check
    check (role in ('admin', 'finance', 'media'));
end $$;

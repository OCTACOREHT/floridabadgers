-- Enable Row Level Security on every base table in the public schema.
-- With RLS enabled and no explicit policies, access is denied by default
-- for anon/authenticated roles (service_role can still bypass).
do $$
declare
  t record;
begin
  for t in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'alter table %I.%I enable row level security;',
      t.schemaname,
      t.tablename
    );
  end loop;
end;
$$;

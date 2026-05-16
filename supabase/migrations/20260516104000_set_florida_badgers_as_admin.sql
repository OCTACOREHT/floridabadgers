-- Ensure the Florida Badgers owner account keeps admin privileges.
do $$
begin
  if to_regclass('public.users') is null then
    return;
  end if;

  update public.users
  set role = 'admin'
  where lower(btrim(email)) = 'floridabadgersfc@gmail.com';
end $$;


create table if not exists site_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in ('page_view', 'registration_submitted', 'contact_submitted')
  ),
  path text not null,
  source text not null default 'web',
  event_value int not null default 1 check (event_value > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chk_site_events_path_non_empty check (length(btrim(path)) > 0)
);

create index if not exists idx_site_events_created_at on site_events(created_at desc);
create index if not exists idx_site_events_event_type on site_events(event_type);
create index if not exists idx_site_events_path on site_events(path);

alter table site_events enable row level security;

-- Store contact form submissions for admin follow-up.
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'replied', 'closed')),
  reply_note text,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chk_contact_messages_full_name_non_empty check (length(btrim(full_name)) > 0),
  constraint chk_contact_messages_email_non_empty check (length(btrim(email)) > 0),
  constraint chk_contact_messages_subject_non_empty check (length(btrim(subject)) > 0),
  constraint chk_contact_messages_message_non_empty check (length(btrim(message)) > 0)
);

create index if not exists idx_contact_messages_created_at
  on contact_messages(created_at desc);

create index if not exists idx_contact_messages_status
  on contact_messages(status);

create index if not exists idx_contact_messages_email
  on contact_messages(email);

alter table contact_messages enable row level security;


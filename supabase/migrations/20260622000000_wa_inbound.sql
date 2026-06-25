-- WhatsApp inbound storage migration
-- Phase 1+2: conversations, messages, audit_logs; RLS; realtime

alter table properties
  add column if not exists wa_instance_name text unique,
  add column if not exists wa_display_number text;

create table wa_conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  guest_phone text not null,
  guest_name text,
  status text not null default 'open',
  unread_count int not null default 0,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (property_id, guest_phone)
);

create table wa_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references wa_conversations(id) on delete cascade,
  direction text not null,
  role text not null,
  body text not null,
  media_url text,
  provider_message_id text,
  status text,
  ai_used boolean default false,
  created_at timestamptz default now()
);
create index on wa_messages (conversation_id, created_at);

create table audit_logs (
  id bigserial primary key,
  actor text,
  action text not null,
  property_id uuid,
  conversation_id uuid,
  payload jsonb,
  created_at timestamptz default now()
);

alter table wa_conversations enable row level security;
alter table wa_messages enable row level security;

create policy wa_conv_owner_read on wa_conversations for select
  using (exists (
    select 1 from properties p
    where p.id = wa_conversations.property_id and p.owner_id = auth.uid()
  ));

create policy wa_msg_owner_read on wa_messages for select
  using (exists (
    select 1 from wa_conversations c
    join properties p on p.id = c.property_id
    where c.id = wa_messages.conversation_id and p.owner_id = auth.uid()
  ));

alter publication supabase_realtime add table wa_messages;
alter publication supabase_realtime add table wa_conversations;

-- Atomic upsert + unread_count increment (called by wa-webhook Edge Function)
create or replace function upsert_wa_conversation(
  p_property_id uuid,
  p_guest_phone text,
  p_guest_name text,
  p_last_message_at timestamptz
) returns uuid language plpgsql security definer
  set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  insert into wa_conversations(property_id, guest_phone, guest_name, last_message_at, unread_count)
  values (p_property_id, p_guest_phone, p_guest_name, p_last_message_at, 1)
  on conflict (property_id, guest_phone) do update
    set last_message_at = excluded.last_message_at,
        unread_count    = wa_conversations.unread_count + 1,
        guest_name      = coalesce(excluded.guest_name, wa_conversations.guest_name)
  returning id into v_id;
  return v_id;
end;
$$;

-- Only the service_role (used by wa-webhook Edge Function) may call this.
-- Authenticated users must not be able to forge inbound conversation records.
revoke execute on function upsert_wa_conversation(uuid, text, text, timestamptz) from public, anon, authenticated;
grant  execute on function upsert_wa_conversation(uuid, text, text, timestamptz) to service_role;

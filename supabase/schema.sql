create extension if not exists pgcrypto;

create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  auto_seo_id bigint not null unique,
  title text not null,
  slug text not null unique,
  url text not null unique,
  meta_description text not null default '',
  excerpt text not null default '',
  content_html text not null default '',
  content_markdown text not null default '',
  hero_image_url text,
  hero_image_alt text,
  infographic_image_url text,
  infographic_image_alt text,
  keywords jsonb not null default '[]'::jsonb,
  meta_keywords text,
  faq_schema jsonb not null default '[]'::jsonb,
  language_code text not null default 'es',
  status text not null default 'published',
  published_at timestamptz not null,
  updated_at timestamptz not null,
  created_at timestamptz not null,
  reading_time_minutes integer not null default 1,
  updated_on_site_at timestamptz not null default timezone('utc', now()),
  created_on_site_at timestamptz not null default timezone('utc', now())
);

create index if not exists blog_articles_published_at_idx
  on public.blog_articles (published_at desc);

alter table public.blog_articles enable row level security;

insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do update
set public = true;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read blog media'
  ) then
    create policy "Public can read blog media"
      on storage.objects
      for select
      to public
      using (bucket_id = 'blog-media');
  end if;
end
$$;

create table if not exists public.c360_speed_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  lead_kind text not null,
  trigger_source text not null,
  status text not null,
  sales_call_status text,
  customer_call_status text,
  full_name text not null,
  phone text not null,
  email text,
  procedure_interest text,
  message text,
  summary_text text,
  source_url text,
  payment_status text not null default 'not_required',
  payment_due_at timestamptz,
  payment_confirmed_at timestamptz,
  payment_reference text,
  booking_reference text,
  payment_url text,
  external_reference_candidates jsonb not null default '[]'::jsonb,
  assigned_agent_name text,
  assigned_agent_phone text,
  assigned_agent_email text,
  agent_attempts integer not null default 0,
  dispatch_scheduled_at timestamptz,
  first_attempt_at timestamptz,
  customer_connected_at timestamptz,
  completed_at timestamptz,
  twilio_sales_call_sid text,
  twilio_customer_call_sid text,
  last_error text,
  pipeline_stage text not null default 'nuevo',
  pipeline_outcome text,
  pipeline_outcome_reason_code text,
  pipeline_outcome_reason text,
  pipeline_outcome_at timestamptz,
  pipeline_value numeric(12, 2),
  evaluation_scheduled_at timestamptz,
  surgery_booked_at timestamptz,
  recording_sid text,
  recording_url text,
  recording_duration integer,
  recording_status text,
  transcription_sid text,
  transcription_text text,
  transcription_status text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.c360_speed_leads add column if not exists pipeline_stage text not null default 'nuevo';
alter table public.c360_speed_leads add column if not exists pipeline_outcome text;
alter table public.c360_speed_leads add column if not exists pipeline_outcome_reason_code text;
alter table public.c360_speed_leads add column if not exists pipeline_outcome_reason text;
alter table public.c360_speed_leads add column if not exists pipeline_outcome_at timestamptz;
alter table public.c360_speed_leads add column if not exists pipeline_value numeric(12, 2);
alter table public.c360_speed_leads add column if not exists evaluation_scheduled_at timestamptz;
alter table public.c360_speed_leads add column if not exists surgery_booked_at timestamptz;
alter table public.c360_speed_leads add column if not exists recording_sid text;
alter table public.c360_speed_leads add column if not exists recording_url text;
alter table public.c360_speed_leads add column if not exists recording_duration integer;
alter table public.c360_speed_leads add column if not exists recording_status text;
alter table public.c360_speed_leads add column if not exists transcription_sid text;
alter table public.c360_speed_leads add column if not exists transcription_text text;
alter table public.c360_speed_leads add column if not exists transcription_status text;
alter table public.c360_speed_leads add column if not exists assigned_agent_email text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'c360_speed_leads_pipeline_outcome_reason_code_check'
  ) then
    alter table public.c360_speed_leads
      add constraint c360_speed_leads_pipeline_outcome_reason_code_check
      check (
        pipeline_outcome_reason_code is null
        or pipeline_outcome_reason_code in (
          'no_responde',
          'precio',
          'no_califica_medicamente',
          'eligio_otra_clinica',
          'otro'
        )
      );
  end if;
end
$$;

create table if not exists public.c360_speed_lead_events (
  id bigserial primary key,
  lead_id uuid not null references public.c360_speed_leads(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.c360_speed_lead_notes (
  id bigserial primary key,
  lead_id uuid not null references public.c360_speed_leads(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  deleted_at timestamptz,
  author_email text,
  edited_by_email text,
  deleted_by_email text,
  body text not null
);

alter table public.c360_speed_lead_notes add column if not exists updated_at timestamptz;
alter table public.c360_speed_lead_notes add column if not exists deleted_at timestamptz;
alter table public.c360_speed_lead_notes add column if not exists edited_by_email text;
alter table public.c360_speed_lead_notes add column if not exists deleted_by_email text;

create table if not exists public.c360_speed_tracking_events (
  id bigserial primary key,
  created_at timestamptz not null default timezone('utc', now()),
  lead_id uuid references public.c360_speed_leads(id) on delete set null,
  event_name text not null,
  event_source text not null default 'browser',
  source_url text,
  client_ip text,
  client_user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  meta_event_id text,
  meta_dispatched_at timestamptz,
  meta_success boolean,
  meta_response jsonb
);

create table if not exists public.c360_speed_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by text
);

create index if not exists c360_speed_leads_status_idx
  on public.c360_speed_leads (status);

create index if not exists c360_speed_leads_dispatch_scheduled_at_idx
  on public.c360_speed_leads (dispatch_scheduled_at asc);

create index if not exists c360_speed_leads_payment_reference_idx
  on public.c360_speed_leads (payment_reference);

create index if not exists c360_speed_leads_booking_reference_idx
  on public.c360_speed_leads (booking_reference);

create index if not exists c360_speed_leads_assigned_agent_phone_idx
  on public.c360_speed_leads (assigned_agent_phone);

create index if not exists c360_speed_leads_assigned_agent_email_idx
  on public.c360_speed_leads (assigned_agent_email);

create index if not exists c360_speed_leads_sales_call_sid_idx
  on public.c360_speed_leads (twilio_sales_call_sid);

create index if not exists c360_speed_leads_customer_call_sid_idx
  on public.c360_speed_leads (twilio_customer_call_sid);

create index if not exists c360_speed_leads_pipeline_stage_idx
  on public.c360_speed_leads (pipeline_stage);

create index if not exists c360_speed_leads_pipeline_outcome_idx
  on public.c360_speed_leads (pipeline_outcome);

create index if not exists c360_speed_lead_events_lead_id_idx
  on public.c360_speed_lead_events (lead_id, created_at desc);

create index if not exists c360_speed_lead_notes_lead_id_idx
  on public.c360_speed_lead_notes (lead_id, created_at desc);

create index if not exists c360_speed_lead_notes_active_idx
  on public.c360_speed_lead_notes (lead_id, created_at desc)
  where deleted_at is null;

create index if not exists c360_speed_tracking_events_lead_id_idx
  on public.c360_speed_tracking_events (lead_id, created_at desc);

create index if not exists c360_speed_tracking_events_event_name_idx
  on public.c360_speed_tracking_events (event_name, created_at desc);

create or replace function public.c360_claim_due_speed_leads(
  p_limit integer default 20,
  p_now timestamptz default timezone('utc', now())
)
returns setof public.c360_speed_leads
language plpgsql
security definer
as $$
begin
  return query
  with due_rows as (
    select leads.id
    from public.c360_speed_leads as leads
    where leads.status = 'scheduled'
      and leads.dispatch_scheduled_at is not null
      and leads.dispatch_scheduled_at <= p_now
      and coalesce(leads.payment_status, 'not_required') <> 'confirmed'
    order by leads.dispatch_scheduled_at asc, leads.created_at asc
    limit greatest(coalesce(p_limit, 20), 1)
    for update skip locked
  ),
  claimed_rows as (
    update public.c360_speed_leads as leads
    set
      status = 'dispatching',
      updated_at = timezone('utc', now())
    from due_rows
    where leads.id = due_rows.id
    returning leads.*
  )
  select * from claimed_rows;
end
$$;

create or replace function public.c360_dashboard_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'c360_role', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'dashboard_role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'c360_role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'dashboard_role', ''),
    'agent'
  );
$$;

create or replace function public.c360_dashboard_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

alter table public.c360_speed_leads enable row level security;
alter table public.c360_speed_lead_events enable row level security;
alter table public.c360_speed_lead_notes enable row level security;
alter table public.c360_speed_tracking_events enable row level security;
alter table public.c360_speed_settings enable row level security;

drop policy if exists "c360 dashboard admins can read leads" on public.c360_speed_leads;
create policy "c360 dashboard admins can read leads"
  on public.c360_speed_leads
  for select
  to authenticated
  using (public.c360_dashboard_role() = 'admin');

drop policy if exists "c360 dashboard agents can read own leads" on public.c360_speed_leads;
create policy "c360 dashboard agents can read own leads"
  on public.c360_speed_leads
  for select
  to authenticated
  using (
    public.c360_dashboard_role() = 'agent'
    and lower(coalesce(assigned_agent_email, '')) = public.c360_dashboard_email()
  );

drop policy if exists "c360 dashboard admins can mutate leads" on public.c360_speed_leads;
create policy "c360 dashboard admins can mutate leads"
  on public.c360_speed_leads
  for all
  to authenticated
  using (public.c360_dashboard_role() = 'admin')
  with check (public.c360_dashboard_role() = 'admin');

drop policy if exists "c360 dashboard agents can mutate own leads" on public.c360_speed_leads;
create policy "c360 dashboard agents can mutate own leads"
  on public.c360_speed_leads
  for update
  to authenticated
  using (
    public.c360_dashboard_role() = 'agent'
    and lower(coalesce(assigned_agent_email, '')) = public.c360_dashboard_email()
  )
  with check (
    public.c360_dashboard_role() = 'agent'
    and lower(coalesce(assigned_agent_email, '')) = public.c360_dashboard_email()
  );

drop policy if exists "c360 dashboard admins can read settings" on public.c360_speed_settings;
create policy "c360 dashboard admins can read settings"
  on public.c360_speed_settings
  for select
  to authenticated
  using (public.c360_dashboard_role() = 'admin');

drop policy if exists "c360 dashboard admins can mutate settings" on public.c360_speed_settings;
create policy "c360 dashboard admins can mutate settings"
  on public.c360_speed_settings
  for all
  to authenticated
  using (public.c360_dashboard_role() = 'admin')
  with check (public.c360_dashboard_role() = 'admin');

drop policy if exists "c360 dashboard users can read accessible notes" on public.c360_speed_lead_notes;
create policy "c360 dashboard users can read accessible notes"
  on public.c360_speed_lead_notes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.c360_speed_leads leads
      where leads.id = c360_speed_lead_notes.lead_id
        and (
          public.c360_dashboard_role() = 'admin'
          or lower(coalesce(leads.assigned_agent_email, '')) = public.c360_dashboard_email()
        )
    )
  );

drop policy if exists "c360 dashboard users can mutate accessible notes" on public.c360_speed_lead_notes;
create policy "c360 dashboard users can mutate accessible notes"
  on public.c360_speed_lead_notes
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.c360_speed_leads leads
      where leads.id = c360_speed_lead_notes.lead_id
        and (
          public.c360_dashboard_role() = 'admin'
          or lower(coalesce(leads.assigned_agent_email, '')) = public.c360_dashboard_email()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.c360_speed_leads leads
      where leads.id = c360_speed_lead_notes.lead_id
        and (
          public.c360_dashboard_role() = 'admin'
          or lower(coalesce(leads.assigned_agent_email, '')) = public.c360_dashboard_email()
        )
    )
  );

drop policy if exists "c360 dashboard users can read accessible events" on public.c360_speed_lead_events;
create policy "c360 dashboard users can read accessible events"
  on public.c360_speed_lead_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.c360_speed_leads leads
      where leads.id = c360_speed_lead_events.lead_id
        and (
          public.c360_dashboard_role() = 'admin'
          or lower(coalesce(leads.assigned_agent_email, '')) = public.c360_dashboard_email()
        )
    )
  );

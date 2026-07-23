-- South Current Ops production schema
-- Run once in a new Supabase project's SQL Editor.
-- No GPS, geolocation, route-history, or background-location fields exist.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'manager', 'employee');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.client_type as enum ('residential', 'commercial', 'agricultural');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.service_category as enum ('electrical', 'solar', 'boring');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.job_status as enum ('lead', 'scheduled', 'in-progress', 'completed', 'invoiced');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.time_status as enum ('active', 'submitted', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Winnipeg',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  title text not null default 'Electrician',
  role public.user_role not null default 'employee',
  hourly_rate numeric(10,2) check (hourly_rate is null or hourly_rate >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text not null,
  client_type public.client_type not null default 'commercial',
  email text,
  phone text,
  address text,
  city text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  job_number text not null,
  title text not null,
  status public.job_status not null default 'lead',
  category public.service_category not null default 'electrical',
  address text,
  city text,
  scheduled_date date not null,
  estimated_hours numeric(8,2) not null default 0 check (estimated_hours >= 0),
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, job_number)
);

create table if not exists public.job_assignments (
  job_id uuid not null references public.jobs(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (job_id, employee_id)
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete restrict,
  work_date date not null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  break_minutes integer not null default 0 check (break_minutes between 0 and 1440),
  notes text,
  manual boolean not null default false,
  status public.time_status not null default 'submitted',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_time_range check (clock_out is null or clock_out > clock_in),
  constraint active_timer_shape check (
    (status = 'active' and clock_out is null)
    or (status <> 'active' and clock_out is not null)
  )
);

create unique index if not exists one_active_timer_per_employee
  on public.time_entries(employee_id)
  where status = 'active' and clock_out is null;
create index if not exists clients_organization_idx on public.clients(organization_id);
create index if not exists jobs_organization_status_idx on public.jobs(organization_id, status);
create index if not exists jobs_scheduled_date_idx on public.jobs(organization_id, scheduled_date);
create index if not exists time_entries_employee_clock_idx on public.time_entries(employee_id, clock_in desc);
create index if not exists time_entries_organization_status_idx on public.time_entries(organization_id, status);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_record jsonb,
  new_record jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_org_created_idx
  on public.audit_events(organization_id, created_at desc);

create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path = public
as $$ select organization_id from public.profiles where id = auth.uid() and active $$;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and active $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_organization uuid;
  requested_role public.user_role;
begin
  requested_organization := nullif(new.raw_user_meta_data ->> 'organization_id', '')::uuid;
  if requested_organization is null then
    return new;
  end if;
  requested_role := coalesce(
    nullif(new.raw_user_meta_data ->> 'role', '')::public.user_role,
    'employee'
  );
  insert into public.profiles (
    id, organization_id, full_name, email, title, role
  ) values (
    new.id,
    requested_organization,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'title', 'Electrician'),
    requested_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists clients_touch_updated_at on public.clients;
create trigger clients_touch_updated_at before update on public.clients
for each row execute function public.touch_updated_at();
drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at before update on public.jobs
for each row execute function public.touch_updated_at();
drop trigger if exists time_entries_touch_updated_at on public.time_entries;
create trigger time_entries_touch_updated_at before update on public.time_entries
for each row execute function public.touch_updated_at();

create or replace function public.capture_audit_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  old_json jsonb;
  new_json jsonb;
  org_id uuid;
  row_id uuid;
begin
  old_json := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_json := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  org_id := coalesce((new_json ->> 'organization_id')::uuid, (old_json ->> 'organization_id')::uuid);
  row_id := coalesce((new_json ->> 'id')::uuid, (old_json ->> 'id')::uuid);
  insert into public.audit_events (
    organization_id, actor_id, table_name, record_id, action, old_record, new_record
  ) values (
    org_id, auth.uid(), tg_table_name, row_id, tg_op, old_json, new_json
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists clients_audit on public.clients;
create trigger clients_audit after insert or update or delete on public.clients
for each row execute function public.capture_audit_event();
drop trigger if exists jobs_audit on public.jobs;
create trigger jobs_audit after insert or update or delete on public.jobs
for each row execute function public.capture_audit_event();
drop trigger if exists time_entries_audit on public.time_entries;
create trigger time_entries_audit after insert or update or delete on public.time_entries
for each row execute function public.capture_audit_event();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignments enable row level security;
alter table public.time_entries enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "Members read organization" on public.organizations;
create policy "Members read organization" on public.organizations for select
using (id = public.current_organization_id());

drop policy if exists "Members read profiles" on public.profiles;
create policy "Members read profiles" on public.profiles for select
using (organization_id = public.current_organization_id());
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles for update
using (
  organization_id = public.current_organization_id()
  and public.current_user_role() = 'admin'
)
with check (organization_id = public.current_organization_id());

drop policy if exists "Members read clients" on public.clients;
create policy "Members read clients" on public.clients for select
using (organization_id = public.current_organization_id());
drop policy if exists "Managers create clients" on public.clients;
create policy "Managers create clients" on public.clients for insert
with check (
  organization_id = public.current_organization_id()
  and public.current_user_role() in ('admin', 'manager')
  and created_by = auth.uid()
);
drop policy if exists "Managers update clients" on public.clients;
create policy "Managers update clients" on public.clients for update
using (
  organization_id = public.current_organization_id()
  and public.current_user_role() in ('admin', 'manager')
)
with check (organization_id = public.current_organization_id());

drop policy if exists "Members read jobs" on public.jobs;
create policy "Members read jobs" on public.jobs for select
using (organization_id = public.current_organization_id());
drop policy if exists "Managers create jobs" on public.jobs;
create policy "Managers create jobs" on public.jobs for insert
with check (
  organization_id = public.current_organization_id()
  and public.current_user_role() in ('admin', 'manager')
  and created_by = auth.uid()
);
drop policy if exists "Managers update jobs" on public.jobs;
create policy "Managers update jobs" on public.jobs for update
using (
  organization_id = public.current_organization_id()
  and public.current_user_role() in ('admin', 'manager')
)
with check (organization_id = public.current_organization_id());

drop policy if exists "Members read assignments" on public.job_assignments;
create policy "Members read assignments" on public.job_assignments for select
using (
  exists (
    select 1 from public.jobs
    where jobs.id = job_assignments.job_id
      and jobs.organization_id = public.current_organization_id()
  )
);
drop policy if exists "Managers manage assignments" on public.job_assignments;
create policy "Managers manage assignments" on public.job_assignments for all
using (public.current_user_role() in ('admin', 'manager'))
with check (
  public.current_user_role() in ('admin', 'manager')
  and exists (
    select 1 from public.jobs
    where jobs.id = job_assignments.job_id
      and jobs.organization_id = public.current_organization_id()
  )
  and exists (
    select 1 from public.profiles
    where profiles.id = job_assignments.employee_id
      and profiles.organization_id = public.current_organization_id()
  )
);

drop policy if exists "Authorized users read time" on public.time_entries;
create policy "Authorized users read time" on public.time_entries for select
using (
  organization_id = public.current_organization_id()
  and (
    employee_id = auth.uid()
    or public.current_user_role() in ('admin', 'manager')
  )
);
drop policy if exists "Employees create own time" on public.time_entries;
create policy "Employees create own time" on public.time_entries for insert
with check (
  organization_id = public.current_organization_id()
  and employee_id = auth.uid()
  and status in ('active', 'submitted')
);
drop policy if exists "Employees update own open time" on public.time_entries;
create policy "Employees update own open time" on public.time_entries for update
using (
  organization_id = public.current_organization_id()
  and (
    (employee_id = auth.uid() and status in ('active', 'submitted', 'rejected'))
    or public.current_user_role() in ('admin', 'manager')
  )
)
with check (organization_id = public.current_organization_id());
drop policy if exists "Managers delete time" on public.time_entries;
create policy "Managers delete time" on public.time_entries for delete
using (
  organization_id = public.current_organization_id()
  and public.current_user_role() in ('admin', 'manager')
);

drop policy if exists "Admins read audit events" on public.audit_events;
create policy "Admins read audit events" on public.audit_events for select
using (
  organization_id = public.current_organization_id()
  and public.current_user_role() = 'admin'
);

create or replace function public.review_time_entry(
  entry_id uuid,
  decision public.time_status
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() not in ('admin', 'manager') then
    raise exception 'Manager access required';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;
  update public.time_entries
  set
    status = decision,
    approved_by = case when decision = 'approved' then auth.uid() else null end,
    approved_at = case when decision = 'approved' then now() else null end
  where id = entry_id
    and organization_id = public.current_organization_id()
    and status in ('submitted', 'rejected');
  if not found then
    raise exception 'Time entry is unavailable for review';
  end if;
end;
$$;

revoke all on function public.review_time_entry(uuid, public.time_status) from public;
grant execute on function public.review_time_entry(uuid, public.time_status) to authenticated;

-- South Current Ops production database
-- Run in a new Supabase project's SQL Editor.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'manager', 'employee');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.client_status as enum ('lead', 'active', 'inactive');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.job_status as enum ('lead', 'quoted', 'scheduled', 'in_progress', 'complete', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.job_priority as enum ('low', 'normal', 'high', 'urgent');
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
  role public.user_role not null default 'employee',
  hourly_rate numeric(10,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  email text,
  phone text,
  address text,
  city text,
  status public.client_status not null default 'lead',
  source text,
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
  service_type text not null,
  status public.job_status not null default 'lead',
  priority public.job_priority not null default 'normal',
  address text,
  city text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  budget_hours numeric(8,2),
  notes text,
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
  start_time timestamptz not null,
  end_time timestamptz,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  notes text,
  status public.time_status not null default 'submitted',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_time_range check (end_time is null or end_time > start_time)
);

create index if not exists clients_organization_idx on public.clients(organization_id);
create index if not exists jobs_organization_status_idx on public.jobs(organization_id, status);
create index if not exists time_entries_employee_start_idx on public.time_entries(employee_id, start_time desc);
create index if not exists time_entries_organization_status_idx on public.time_entries(organization_id, status);

create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path = public
as $$ select organization_id from public.profiles where id = auth.uid() $$;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists clients_touch_updated_at on public.clients;
create trigger clients_touch_updated_at before update on public.clients
for each row execute function public.touch_updated_at();
drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at before update on public.jobs
for each row execute function public.touch_updated_at();
drop trigger if exists time_entries_touch_updated_at on public.time_entries;
create trigger time_entries_touch_updated_at before update on public.time_entries
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_organization uuid;
  requested_role public.user_role;
begin
  requested_organization := (new.raw_user_meta_data ->> 'organization_id')::uuid;
  requested_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'employee');
  if requested_organization is null then
    raise exception 'organization_id is required in user metadata';
  end if;
  insert into public.profiles (id, organization_id, full_name, email, role)
  values (
    new.id,
    requested_organization,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    requested_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignments enable row level security;
alter table public.time_entries enable row level security;

drop policy if exists "Members read organization" on public.organizations;
create policy "Members read organization" on public.organizations for select
using (id = public.current_organization_id());

drop policy if exists "Members read profiles" on public.profiles;
create policy "Members read profiles" on public.profiles for select
using (organization_id = public.current_organization_id());
drop policy if exists "Managers update profiles" on public.profiles;
create policy "Managers update profiles" on public.profiles for update
using (organization_id = public.current_organization_id() and public.current_user_role() in ('admin','manager'))
with check (organization_id = public.current_organization_id());

drop policy if exists "Members read clients" on public.clients;
create policy "Members read clients" on public.clients for select
using (organization_id = public.current_organization_id());
drop policy if exists "Managers create clients" on public.clients;
create policy "Managers create clients" on public.clients for insert
with check (organization_id = public.current_organization_id() and public.current_user_role() in ('admin','manager'));
drop policy if exists "Managers update clients" on public.clients;
create policy "Managers update clients" on public.clients for update
using (organization_id = public.current_organization_id() and public.current_user_role() in ('admin','manager'))
with check (organization_id = public.current_organization_id());

drop policy if exists "Members read jobs" on public.jobs;
create policy "Members read jobs" on public.jobs for select
using (organization_id = public.current_organization_id());
drop policy if exists "Managers create jobs" on public.jobs;
create policy "Managers create jobs" on public.jobs for insert
with check (organization_id = public.current_organization_id() and public.current_user_role() in ('admin','manager'));
drop policy if exists "Managers update jobs" on public.jobs;
create policy "Managers update jobs" on public.jobs for update
using (organization_id = public.current_organization_id() and public.current_user_role() in ('admin','manager'))
with check (organization_id = public.current_organization_id());

drop policy if exists "Members read assignments" on public.job_assignments;
create policy "Members read assignments" on public.job_assignments for select
using (exists (
  select 1 from public.jobs
  where jobs.id = job_assignments.job_id
  and jobs.organization_id = public.current_organization_id()
));
drop policy if exists "Managers manage assignments" on public.job_assignments;
create policy "Managers manage assignments" on public.job_assignments for all
using (public.current_user_role() in ('admin','manager'))
with check (public.current_user_role() in ('admin','manager'));

drop policy if exists "Members read time" on public.time_entries;
create policy "Members read time" on public.time_entries for select
using (
  organization_id = public.current_organization_id()
  and (employee_id = auth.uid() or public.current_user_role() in ('admin','manager'))
);
drop policy if exists "Employees create time" on public.time_entries;
create policy "Employees create time" on public.time_entries for insert
with check (
  organization_id = public.current_organization_id()
  and employee_id = auth.uid()
  and status in ('active','submitted')
);
drop policy if exists "Employees update time" on public.time_entries;
create policy "Employees update time" on public.time_entries for update
using (
  organization_id = public.current_organization_id()
  and (
    (employee_id = auth.uid() and status in ('active','submitted','rejected'))
    or public.current_user_role() in ('admin','manager')
  )
)
with check (organization_id = public.current_organization_id());

-- Deliberately no GPS or location-capture columns.

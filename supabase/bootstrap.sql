-- First-organization bootstrap
-- 1. Run schema.sql.
-- 2. Create the first user in Supabase Authentication.
-- 3. Replace both placeholders below and run this statement.

with new_org as (
  insert into public.organizations (name, timezone)
  values ('South Current Electric Inc.', 'America/Winnipeg')
  returning id
)
insert into public.profiles (
  id,
  organization_id,
  full_name,
  email,
  title,
  role,
  active
)
select
  'REPLACE_WITH_AUTH_USER_UUID'::uuid,
  new_org.id,
  'South Current Administrator',
  'REPLACE_WITH_ADMIN_EMAIL',
  'Owner / Master Electrician',
  'admin',
  true
from new_org;

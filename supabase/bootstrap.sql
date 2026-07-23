-- Run after schema.sql to create the South Current organization.
-- Copy the returned organization_id into each new Auth user's metadata.

insert into public.organizations (name, timezone)
values ('South Current Electric Inc.', 'America/Winnipeg')
returning id as organization_id;

-- In Supabase Authentication > Users, create a user with metadata like:
-- {
--   "full_name": "Administrator Name",
--   "organization_id": "PASTE-THE-UUID-RETURNED-ABOVE",
--   "role": "admin"
-- }

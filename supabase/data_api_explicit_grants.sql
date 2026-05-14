-- Incremental migration: explicit Data API grants for Supabase rollout
-- Run this once on existing projects.

begin;

grant usage on schema public to anon, authenticated, service_role;

-- Reset anonymous role to least privilege before applying explicit public access grants.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

-- Keep public website/API behaviors that intentionally allow unauthenticated access.
grant select on table public.leaderboard to anon;
grant select, insert on table public.reviews to anon;
grant insert on table public.support_messages to anon;
grant select on table public.ad_providers_config to anon;

-- Main app access (guarded by RLS policies).
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;

grant execute on all functions in schema public to authenticated;
grant execute on all functions in schema public to service_role;

-- Ensure future tables/functions/sequences remain available via Data API by default.
alter default privileges for role postgres in schema public
grant select, insert, update, delete on tables to authenticated;
alter default privileges for role postgres in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges for role postgres in schema public
grant usage, select on sequences to authenticated;
alter default privileges for role postgres in schema public
grant usage, select on sequences to service_role;

alter default privileges for role postgres in schema public
grant execute on functions to authenticated;
alter default privileges for role postgres in schema public
grant execute on functions to service_role;

commit;

-- INCREMENTAL MIGRATION FOR EXISTING DATABASES
-- Use this only on an existing database that already has profiles/app_config data.
-- Do not run this instead of schema.sql on a fresh project.

begin;

update public.profiles
set plan_key = case
  when plan_key = 'starter19' then 'starter'
  when plan_key = 'growth49' then 'pro'
  when plan_key in ('scale99', 'command149') then 'scale'
  when plan_key in ('free', 'starter', 'pro', 'scale') then plan_key
  else 'free'
end,
updated_at = now()
where plan_key is distinct from case
  when plan_key = 'starter19' then 'starter'
  when plan_key = 'growth49' then 'pro'
  when plan_key in ('scale99', 'command149') then 'scale'
  when plan_key in ('free', 'starter', 'pro', 'scale') then plan_key
  else 'free'
end;

alter table public.profiles alter column plan_key set default 'free';
alter table public.profiles alter column credits_balance set default 2;
alter table public.profiles alter column monthly_analysis_limit set default 2;

alter table public.profiles drop constraint if exists profiles_plan_key_check;
alter table public.profiles add constraint profiles_plan_key_check check (plan_key in ('free', 'starter', 'pro', 'scale'));

insert into public.app_config (key, value_json, updated_at)
values (
  'reward_ads',
  jsonb_build_object('daily_ad_limit', 6, 'daily_reward_credits', 1),
  now()
)
on conflict (key) do update
set value_json = excluded.value_json,
    updated_at = now();

insert into public.app_config (key, value_json, updated_at)
values (
  'referral_settings',
  jsonb_build_object('reward_credits', 1),
  now()
)
on conflict (key) do update
set value_json = excluded.value_json,
    updated_at = now();

insert into public.app_config (key, value_json, updated_at)
values (
  'monetization_settings',
  jsonb_build_object(
    'smart_paywall_enabled', true,
    'premium_gate_score', 76,
    'high_intent_confidence', 72,
    'free_analyses_before_paywall', 1,
    'credit_pack_upsell_score', 68,
    'annual_discount_percent', 15,
    'ad_unlock_enabled', true,
    'estimated_cac_usd', 24,
    'ltv_months', 10,
    'target_ltv_to_cac_ratio', 4
  ),
  now()
)
on conflict (key) do update
set value_json = excluded.value_json,
    updated_at = now();

insert into public.app_config (key, value_json, updated_at)
values (
  'pricing_settings',
  jsonb_build_object(
    'dynamic_pricing_enabled', true,
    'premium_annual_discount_percent', 15,
    'price_experiment_intensity', 1,
    'high_intent_boost_percent', 12
  ),
  now()
)
on conflict (key) do update
set value_json = excluded.value_json,
    updated_at = now();

commit;
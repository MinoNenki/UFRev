-- CANONICAL BASE SCHEMA FOR A FRESH SUPABASE PROJECT
-- Use this file when stawiasz nową bazę od zera.
-- For an existing production/project database use only incremental migration files below.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  role text not null default 'user',
  onboarding_completed boolean not null default false,
  plan_key text not null default 'free' check (plan_key in ('free', 'starter', 'pro', 'scale')),
  credits_balance integer not null default 2,
  monthly_analysis_limit integer not null default 2,
  analyses_used_this_month integer not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  referral_code text unique,
  referred_by uuid references public.profiles(id) on delete set null,
  referral_credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key text primary key,
  value_json jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.app_config (key, value_json) values ('reward_ads', jsonb_build_object('daily_ad_limit', 6, 'daily_reward_credits', 1)) on conflict (key) do nothing;

insert into public.app_config (key, value_json) values ('automation_settings', jsonb_build_object(
  'auto_competitor_scans', true,
  'auto_market_watch_alerts', true,
  'weekly_market_digest', true,
  'auto_margin_alerts', true,
  'auto_review_requests', true,
  'auto_restock_warnings', true,
  'auto_pause_low_margin_ads', false,
  'sync_interval_minutes', 60,
  'price_floor_percent', 18,
  'max_daily_reward_claims', 10,
  'profitability_guardrail_percent', 22,
  'min_confidence_for_buy', 60,
  'max_safe_test_budget_usd', 800,
  'require_competitor_evidence_for_buy', true,
  'require_url_for_buy', true,
  'require_manual_approval_for_scale', true,
  'kill_switch_enabled', true,
  'max_daily_spend_usd', 1500,
  'max_allowed_refund_rate_percent', 8,
  'max_allowed_cac_percent_of_aov', 35,
  'cooldown_hours_after_loss', 24,
  'staged_rollout_percent', 20,
  'staged_rollout_max_waves', 3
)) on conflict (key) do nothing;
insert into public.app_config (key, value_json) values ('integration_settings', jsonb_build_object(
  'shopify_enabled', false,
  'amazon_enabled', false,
  'ebay_enabled', false,
  'alibaba_enabled', false,
  'aliexpress_enabled', false,
  'walmart_enabled', false,
  'etsy_enabled', false,
  'rakuten_enabled', false,
  'allegro_enabled', false,
  'cdiscount_enabled', false,
  'emag_enabled', false,
  'otto_enabled', false,
  'zalando_enabled', false,
  'woocommerce_enabled', false,
  'tiktok_enabled', false,
  'meta_ads_enabled', false,
  'shopify_store_domain', '',
  'amazon_marketplace_id', '',
  'ebay_site_id', 'EBAY_US',
  'woocommerce_store_url', '',
  'alibaba_region', 'GLOBAL',
  'allegro_region', 'PL',
  'tiktok_ad_account_id', '',
  'meta_business_id', '',
  'sync_inventory', true,
  'sync_orders', true,
  'sync_pricing', true,
  'sync_listings', true,
  'sync_returns', true,
  'sync_traffic', true,
  'dry_run_mode', true,
  'require_manual_approval', true,
  'auto_publish_disabled', true,
  'max_sync_price_change_percent', 15,
  'minimum_stock_buffer_units', 5,
  'max_listings_per_hour', 25
)) on conflict (key) do nothing;

create table if not exists public.user_integration_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  shopify_enabled boolean not null default false,
  woocommerce_enabled boolean not null default false,
  amazon_enabled boolean not null default false,
  ebay_enabled boolean not null default false,
  allegro_enabled boolean not null default false,
  shopify_store_domain text not null default '',
  woocommerce_store_url text not null default '',
  sync_inventory boolean not null default true,
  sync_orders boolean not null default true,
  sync_pricing boolean not null default true,
  connection_checks jsonb not null default jsonb_build_object(
    'shopify', jsonb_build_object('state', 'not_configured', 'message', 'No Shopify store configured yet.', 'checkedAt', null, 'evidence', null),
    'woocommerce', jsonb_build_object('state', 'not_configured', 'message', 'No WooCommerce store configured yet.', 'checkedAt', null, 'evidence', null)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.app_config (key, value_json) values ('referral_settings', jsonb_build_object('reward_credits', 1)) on conflict (key) do nothing;
insert into public.app_config (key, value_json) values ('monetization_settings', jsonb_build_object('smart_paywall_enabled', true, 'premium_gate_score', 76, 'high_intent_confidence', 72, 'free_analyses_before_paywall', 1, 'credit_pack_upsell_score', 68, 'annual_discount_percent', 15, 'ad_unlock_enabled', true, 'estimated_cac_usd', 24, 'ltv_months', 10, 'target_ltv_to_cac_ratio', 4)) on conflict (key) do nothing;
insert into public.app_config (key, value_json) values ('retention_settings', jsonb_build_object('inactivity_days_high_risk', 10, 'inactivity_days_medium_risk', 5, 'winback_credit_bonus', 2, 'winback_discount_percent', 25, 'crm_enabled', true, 'churn_defense_enabled', true)) on conflict (key) do nothing;
insert into public.app_config (key, value_json) values ('pricing_settings', jsonb_build_object('dynamic_pricing_enabled', true, 'premium_annual_discount_percent', 15, 'price_experiment_intensity', 1, 'high_intent_boost_percent', 12)) on conflict (key) do nothing;
insert into public.app_config (key, value_json) values ('notification_settings', jsonb_build_object('in_app_enabled', true, 'email_enabled', false, 'telegram_enabled', false, 'discord_enabled', false, 'push_enabled', false, 'realtime_alerts_enabled', true, 'alert_email_address', '', 'telegram_chat_id', '', 'discord_webhook_url', '')) on conflict (key) do nothing;


create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  analysis_type text not null,
  product_name text,
  input_text text not null,
  result_text text not null,
  decision_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  product_name text,
  score integer not null,
  verdict text not null,
  profitability integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_date date not null,
  ads_watched integer not null default 0,
  credits_granted integer not null default 0,
  reward_unlocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, reward_date)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  company_or_role text,
  rating integer not null default 5 check (rating between 1 and 5),
  content text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);



create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  model_name text,
  estimated_input_tokens integer not null default 0,
  estimated_output_tokens integer not null default 0,
  estimated_cost_usd numeric(10,4) not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analysis_execution_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  product_name text,
  verdict text,
  score integer,
  confidence integer,
  burn_risk text,
  recommended_plan text,
  revenue_mode text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.monetization_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  item_key text,
  item_type text,
  amount_usd numeric(10,2),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.retention_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  churn_risk numeric(4,2),
  segment text,
  actions jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'in_app',
  title text,
  message text,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  plan_key text not null,
  variant text not null,
  monthly_quote numeric(10,2),
  annual_quote numeric(10,2),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.market_watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  website_url text not null,
  competitor_urls jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, website_url)
);

create table if not exists public.market_watch_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_url text,
  competitor_url text,
  price numeric(10,2),
  price_usd numeric(10,2),
  currency text,
  availability text not null default 'unknown',
  title text,
  review_count integer,
  alert_level text not null default 'watch',
  change_summary text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);


create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null unique references public.profiles(id) on delete cascade,
  reward_credits integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  rewarded_at timestamptz
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
declare
  v_user_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_referral_code text;
  v_referrer_id uuid;
  v_has_referral_code boolean;
  v_has_referred_by boolean;
  v_has_referral_events boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'referral_code'
  ) into v_has_referral_code;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'referred_by'
  ) into v_has_referred_by;

  v_has_referral_events := to_regclass('public.referral_events') is not null;

  if v_has_referral_code then
    v_referral_code := substring(md5(random()::text || new.id::text || clock_timestamp()::text), 1, 8);
  end if;

  if v_has_referral_code and v_has_referred_by and (v_user_meta ? 'referral_code') then
    select id into v_referrer_id from public.profiles where referral_code = nullif(btrim(v_user_meta->>'referral_code'), '');
  end if;

  if v_has_referral_code and v_has_referred_by then
    insert into public.profiles (id, email, referral_code, referred_by)
    values (new.id, new.email, v_referral_code, v_referrer_id)
    on conflict (id) do update set email = excluded.email;
  elsif v_has_referral_code then
    insert into public.profiles (id, email, referral_code)
    values (new.id, new.email, v_referral_code)
    on conflict (id) do update set email = excluded.email;
  elsif v_has_referred_by then
    insert into public.profiles (id, email, referred_by)
    values (new.id, new.email, v_referrer_id)
    on conflict (id) do update set email = excluded.email;
  else
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do update set email = excluded.email;
  end if;

  if v_has_referral_events and v_referrer_id is not null then
    insert into public.referral_events (referrer_user_id, referred_user_id, reward_credits, status)
    values (v_referrer_id, new.id, 2, 'pending')
    on conflict (referred_user_id) do nothing;
  end if;

  return new;
exception
  when undefined_table or undefined_column then
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do update set email = excluded.email;
    return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.consume_credit_and_store_analysis(
  p_user_id uuid,
  p_analysis_type text,
  p_input_text text,
  p_result_text text,
  p_product_name text default null,
  p_decision_json jsonb default null,
  p_token_cost integer default 1
)
returns void language plpgsql security definer as $$
declare v_credits integer; declare v_monthly_limit integer; declare v_used integer;
begin
  select credits_balance, monthly_analysis_limit, analyses_used_this_month into v_credits, v_monthly_limit, v_used from public.profiles where id = p_user_id for update;
  if v_credits is null then raise exception 'Profile not found'; end if;
  if coalesce(p_token_cost, 0) <= 0 then raise exception 'Token cost must be positive'; end if;
  if v_credits < p_token_cost then raise exception 'Not enough AI tokens left'; end if;
  if coalesce(v_used, 0) >= coalesce(v_monthly_limit, 0) then raise exception 'Monthly analysis limit reached'; end if;
  update public.profiles
    set credits_balance = credits_balance - p_token_cost,
        analyses_used_this_month = analyses_used_this_month + 1,
        updated_at = now()
  where id = p_user_id;
  insert into public.analyses (user_id, analysis_type, product_name, input_text, result_text, decision_json) values (p_user_id, p_analysis_type, p_product_name, p_input_text, p_result_text, p_decision_json);
end; $$;

create or replace function public.add_credit_pack(p_user_id uuid, p_credits integer) returns void language plpgsql security definer as $$ begin if p_credits <= 0 then raise exception 'Credits must be positive'; end if; update public.profiles set credits_balance = credits_balance + p_credits, updated_at = now() where id = p_user_id; end; $$;

create or replace function public.record_rewarded_ad_view(p_user_id uuid, p_daily_limit integer, p_reward_credits integer)
returns table (watched_today integer, reward_granted boolean, credits_balance integer)
language plpgsql security definer as $$
declare v_today date := timezone('UTC', now())::date; v_reward public.credit_reward_events%rowtype; v_profile public.profiles%rowtype;
begin
  insert into public.credit_reward_events (user_id, reward_date) values (p_user_id, v_today) on conflict (user_id, reward_date) do nothing;
  select * into v_reward from public.credit_reward_events where user_id = p_user_id and reward_date = v_today for update;
  if v_reward.ads_watched >= p_daily_limit then select * into v_profile from public.profiles where id = p_user_id; return query select v_reward.ads_watched, v_reward.reward_unlocked, coalesce(v_profile.credits_balance, 0); return; end if;
  update public.credit_reward_events set ads_watched = ads_watched + 1, updated_at = now() where id = v_reward.id returning * into v_reward;
  if v_reward.ads_watched >= p_daily_limit and not v_reward.reward_unlocked then
    update public.credit_reward_events set reward_unlocked = true, credits_granted = p_reward_credits, updated_at = now() where id = v_reward.id returning * into v_reward;
    update public.profiles set credits_balance = credits_balance + p_reward_credits, updated_at = now() where id = p_user_id returning * into v_profile;
  else
    select * into v_profile from public.profiles where id = p_user_id;
  end if;
  return query select v_reward.ads_watched, v_reward.reward_unlocked, coalesce(v_profile.credits_balance, 0);
end; $$;

create or replace function public.process_referral_activation(p_user_id uuid, p_reward_credits integer default 2)
returns void language plpgsql security definer as $$
declare v_referrer uuid; declare v_event_id uuid;
begin
  select referred_by into v_referrer from public.profiles where id = p_user_id;
  if v_referrer is null then return; end if;
  select id into v_event_id from public.referral_events where referred_user_id = p_user_id and status = 'pending' for update;
  if v_event_id is null then return; end if;
  update public.profiles set credits_balance = credits_balance + p_reward_credits, referral_credits = referral_credits + p_reward_credits, updated_at = now() where id = v_referrer;
  update public.referral_events set status = 'rewarded', reward_credits = p_reward_credits, rewarded_at = now() where id = v_event_id;
end; $$;

alter table public.profiles enable row level security;
alter table public.app_config enable row level security;
alter table public.analyses enable row level security;
alter table public.leaderboard enable row level security;
alter table public.billing_events enable row level security;
alter table public.credit_reward_events enable row level security;
alter table public.reviews enable row level security;
alter table public.support_messages enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.analysis_execution_logs enable row level security;
alter table public.monetization_events enable row level security;
alter table public.retention_events enable row level security;
alter table public.crm_events enable row level security;
alter table public.notification_events enable row level security;
alter table public.pricing_experiments enable row level security;
alter table public.market_watchlists enable row level security;
alter table public.market_watch_events enable row level security;
alter table public.security_events enable row level security;
alter table public.referral_events enable row level security;
alter table public.user_integration_settings enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile limited" on public.profiles;
drop policy if exists "Authenticated users can read app config" on public.app_config;
drop policy if exists "Users can read own analyses" on public.analyses;
drop policy if exists "Users can insert own analyses" on public.analyses;
drop policy if exists "Anyone can read leaderboard" on public.leaderboard;
drop policy if exists "Users can read own billing events" on public.billing_events;
drop policy if exists "Users can read own reward events" on public.credit_reward_events;
drop policy if exists "Anyone can create review" on public.reviews;
drop policy if exists "Anyone can read approved reviews" on public.reviews;
drop policy if exists "Anyone can create support message" on public.support_messages;
drop policy if exists "Users can read own support messages" on public.support_messages;
drop policy if exists "Users can read own market watchlists" on public.market_watchlists;
drop policy if exists "Users can insert own market watchlists" on public.market_watchlists;
drop policy if exists "Users can update own market watchlists" on public.market_watchlists;
drop policy if exists "Users can read own market watch events" on public.market_watch_events;
drop policy if exists "Users can insert own market watch events" on public.market_watch_events;
drop policy if exists "Users can read own integration settings" on public.user_integration_settings;
drop policy if exists "Users can insert own integration settings" on public.user_integration_settings;
drop policy if exists "Users can update own integration settings" on public.user_integration_settings;

alter table public.ad_providers_config enable row level security;
alter table public.user_ad_accounts enable row level security;
alter table public.ad_impressions enable row level security;

drop policy if exists "Admin can read ad providers" on public.ad_providers_config;
drop policy if exists "Users can read ad provider list" on public.ad_providers_config;
drop policy if exists "Users can read own ad accounts" on public.user_ad_accounts;
drop policy if exists "Users can insert own ad accounts" on public.user_ad_accounts;
drop policy if exists "Users can update own ad accounts" on public.user_ad_accounts;
drop policy if exists "Users can read own ad impressions" on public.ad_impressions;
drop policy if exists "Users can insert own ad impressions" on public.ad_impressions;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile limited" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Authenticated users can read app config" on public.app_config for select using (auth.role() = 'authenticated');
create policy "Users can read own analyses" on public.analyses for select using (auth.uid() = user_id);
create policy "Users can insert own analyses" on public.analyses for insert with check (auth.uid() = user_id);
create policy "Anyone can read leaderboard" on public.leaderboard for select using (true);
create policy "Users can read own billing events" on public.billing_events for select using (auth.uid() = user_id);
create policy "Users can read own reward events" on public.credit_reward_events for select using (auth.uid() = user_id);
create policy "Anyone can create review" on public.reviews for insert with check (true);
create policy "Anyone can read approved reviews" on public.reviews for select using (status = 'approved' or auth.uid() = user_id);
create policy "Anyone can create support message" on public.support_messages for insert with check (true);
create policy "Users can read own support messages" on public.support_messages for select using (auth.uid() = user_id);
create policy "Users can read own market watchlists" on public.market_watchlists for select using (auth.uid() = user_id);
create policy "Users can insert own market watchlists" on public.market_watchlists for insert with check (auth.uid() = user_id);
create policy "Users can update own market watchlists" on public.market_watchlists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read own market watch events" on public.market_watch_events for select using (auth.uid() = user_id);
create policy "Users can insert own market watch events" on public.market_watch_events for insert with check (auth.uid() = user_id);
create policy "Users can read own integration settings" on public.user_integration_settings for select using (auth.uid() = user_id);
create policy "Users can insert own integration settings" on public.user_integration_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own integration settings" on public.user_integration_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);



create table if not exists public.ad_providers_config (
  id uuid primary key default gen_random_uuid(),
  provider_type text not null unique,
  provider_name text not null,
  enabled boolean not null default false,
  config_json jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ad providers policies (read-only for users, admin-managed)
create policy "Users can read public ad provider list" on public.ad_providers_config for select using (true);

-- User ad accounts policies
create policy "Users can read own ad accounts" on public.user_ad_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own ad accounts" on public.user_ad_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own ad accounts" on public.user_ad_accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own ad accounts" on public.user_ad_accounts for delete using (auth.uid() = user_id);

-- Ad impressions policies
create policy "Users can read own ad impressions" on public.ad_impressions for select using (auth.uid() = user_id);
create policy "Users can insert own ad impressions" on public.ad_impressions for insert with check (auth.uid() = user_id);
create policy "Users can update own ad impressions" on public.ad_impressions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ad providers configuration table (admin-only)
-- Predefined ad provider types
insert into public.ad_providers_config (provider_type, provider_name, enabled, description) values
('google_adsense', 'Google AdSense', false, 'Google''s native advertising platform'),
('google_ads', 'Google Ads', false, 'Google Ads advertiser account and campaign sync'),
('taboola', 'Taboola', false, 'Content discovery and monetization platform'),
('propeller_ads', 'PropellerAds', false, 'Native ads and banner ad network'),
('adproof', 'AdProof', false, 'Performance marketing network'),
('infolinks', 'Infolinks', false, 'In-text and display advertising'),
('smarketingads', 'S-Marketing Ads', false, 'Polish ad network')
on conflict (provider_type) do nothing;

-- User ad accounts table
create table if not exists public.user_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_type text not null references public.ad_providers_config(provider_type) on delete cascade,
  account_email text,
  account_id text,
  access_token text encrypted,
  refresh_token text encrypted,
  is_active boolean not null default true,
  is_verified boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_type)
);

-- Ad impressions tracking table
create table if not exists public.ad_impressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_type text not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  earnings_usd numeric(10,4) not null default 0,
  date date not null,
  currency text default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_type, date)
);

drop policy if exists "Users can read own ai usage logs" on public.ai_usage_logs;
drop policy if exists "Users can read own analysis execution logs" on public.analysis_execution_logs;
drop policy if exists "Users can read own monetization events" on public.monetization_events;
drop policy if exists "Users can read own retention events" on public.retention_events;
drop policy if exists "Users can read own crm events" on public.crm_events;
drop policy if exists "Users can read own notification events" on public.notification_events;
drop policy if exists "Users can read own pricing experiments" on public.pricing_experiments;
drop policy if exists "Users can read own security events" on public.security_events;
drop policy if exists "Service role manages security events" on public.security_events;
drop policy if exists "Service role manages ai usage logs" on public.ai_usage_logs;
drop policy if exists "Service role manages analysis execution logs" on public.analysis_execution_logs;
drop policy if exists "Service role manages monetization events" on public.monetization_events;
drop policy if exists "Service role manages retention events" on public.retention_events;
drop policy if exists "Service role manages crm events" on public.crm_events;
drop policy if exists "Service role manages notification events" on public.notification_events;
drop policy if exists "Service role manages pricing experiments" on public.pricing_experiments;

create policy "Users can read own ai usage logs" on public.ai_usage_logs for select using (auth.uid() = user_id);
create policy "Users can read own analysis execution logs" on public.analysis_execution_logs for select using (auth.uid() = user_id);
create policy "Users can read own monetization events" on public.monetization_events for select using (auth.uid() = user_id);
create policy "Users can read own retention events" on public.retention_events for select using (auth.uid() = user_id);
create policy "Users can read own crm events" on public.crm_events for select using (auth.uid() = user_id);
create policy "Users can read own notification events" on public.notification_events for select using (auth.uid() = user_id);
create policy "Users can read own pricing experiments" on public.pricing_experiments for select using (auth.uid() = user_id);
create policy "Users can read own security events" on public.security_events for select using (auth.uid() = user_id);
create policy "Service role manages analysis execution logs" on public.analysis_execution_logs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages monetization events" on public.monetization_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages retention events" on public.retention_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages crm events" on public.crm_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages notification events" on public.notification_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages pricing experiments" on public.pricing_experiments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages security events" on public.security_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages ai usage logs" on public.ai_usage_logs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


drop policy if exists "Users can read own referral events" on public.referral_events;
drop policy if exists "Service role manages referral events" on public.referral_events;

create policy "Users can read own referral events" on public.referral_events for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);
create policy "Service role manages referral events" on public.referral_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

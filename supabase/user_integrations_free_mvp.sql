-- INCREMENTAL MIGRATION FOR EXISTING DATABASES
-- Use this only when the database already exists and you want to add
-- the user self-service integration flow without rebuilding from schema.sql.

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

alter table public.user_integration_settings enable row level security;

drop policy if exists "Users can read own integration settings" on public.user_integration_settings;
drop policy if exists "Users can insert own integration settings" on public.user_integration_settings;
drop policy if exists "Users can update own integration settings" on public.user_integration_settings;

create policy "Users can read own integration settings" on public.user_integration_settings for select using (auth.uid() = user_id);
create policy "Users can insert own integration settings" on public.user_integration_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own integration settings" on public.user_integration_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.user_integration_settings (user_id)
select p.id
from public.profiles p
left join public.user_integration_settings uis on uis.user_id = p.id
where uis.user_id is null;

update public.app_config
set value_json = value_json - 'x_ads_enabled' - 'x_ads_account_id'
where key = 'integration_settings';

update public.app_config
set value_json = jsonb_set(coalesce(value_json, '{}'::jsonb), '{connection_checks}', coalesce(value_json->'connection_checks', '{}'::jsonb) - 'x', true)
where key = 'integration_settings';
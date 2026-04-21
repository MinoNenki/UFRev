-- Incremental hotfix for existing Supabase projects where signup fails with
-- "Database error saving new user" because referral schema pieces are missing.

create extension if not exists "pgcrypto";

alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid;
alter table public.profiles add column if not exists referral_credits integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_referred_by_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_referred_by_fkey
      foreign key (referred_by) references public.profiles(id) on delete set null;
  end if;
end $$;

update public.profiles
set referral_code = substring(md5(random()::text || id::text || clock_timestamp()::text), 1, 8)
where referral_code is null or btrim(referral_code) = '';

create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code)
  where referral_code is not null;

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null unique references public.profiles(id) on delete cascade,
  reward_credits integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  rewarded_at timestamptz
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
    select id
    into v_referrer_id
    from public.profiles
    where referral_code = nullif(btrim(v_user_meta->>'referral_code'), '');
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
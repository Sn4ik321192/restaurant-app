create extension if not exists pgcrypto;

create table if not exists restaurant_settings (
  id text primary key default 'main',
  admin jsonb not null default '{}'::jsonb,
  restaurant jsonb not null default '{}'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  testimonials jsonb not null default '[]'::jsonb,
  opening_hours jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists menu_items (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0,
  popular boolean not null default false,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  normalized_phone text primary key,
  phone text not null,
  name text not null,
  birth_date date,
  gender text,
  role text not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_addresses (
  id text primary key,
  normalized_phone text not null references profiles(normalized_phone) on delete cascade,
  city text not null default '',
  street text not null default '',
  house text not null default '',
  entrance text not null default '',
  floor text not null default '',
  apartment text not null default '',
  use_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists user_cards (
  id text primary key,
  normalized_phone text not null references profiles(normalized_phone) on delete cascade,
  holder text not null default '',
  expiry text not null default '',
  last4 text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  phone text not null,
  status text not null default 'processed',
  total numeric(10, 2) not null default 0,
  customer jsonb not null default '{}'::jsonb,
  checkout jsonb not null default '{}'::jsonb,
  bonus jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists orders_phone_idx on orders(phone);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  dish_id text not null,
  name text not null,
  category text not null default '',
  description text not null default '',
  price numeric(10, 2) not null default 0,
  quantity integer not null default 1,
  image text not null default ''
);

create table if not exists order_status_events (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  status text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_idx on order_status_events(order_id, created_at desc);

create table if not exists bonus_accounts (
  normalized_phone text primary key,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists bonus_transactions (
  id text primary key,
  normalized_phone text not null,
  type text not null,
  amount integer not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bonus_transactions_phone_idx on bonus_transactions(normalized_phone, created_at desc);

create table if not exists bookings (
  id text primary key,
  normalized_phone text not null default '',
  name text not null default '',
  phone text not null default '',
  date date,
  time time,
  guests integer not null default 1,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bookings_created_at_idx on bookings(created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_restaurant_settings_updated_at on restaurant_settings;
create trigger set_restaurant_settings_updated_at
before update on restaurant_settings
for each row execute function set_updated_at();

drop trigger if exists set_menu_items_updated_at on menu_items;
create trigger set_menu_items_updated_at
before update on menu_items
for each row execute function set_updated_at();

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at
before update on orders
for each row execute function set_updated_at();

create or replace function cleanup_completed_orders(retention_days integer default 30)
returns integer
language plpgsql
as $$
declare
  deleted_count integer;
begin
  delete from orders
  where status = 'delivered'
    and delivered_at is not null
    and delivered_at < now() - make_interval(days => retention_days);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Demo policies. They make the template work from a static frontend.
-- For a real restaurant, replace them with proper RLS rules or a backend API.
alter table restaurant_settings enable row level security;
alter table menu_items enable row level security;
alter table profiles enable row level security;
alter table user_addresses enable row level security;
alter table user_cards enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_events enable row level security;
alter table bonus_accounts enable row level security;
alter table bonus_transactions enable row level security;
alter table bookings enable row level security;

drop policy if exists "demo_read_restaurant_settings" on restaurant_settings;
create policy "demo_read_restaurant_settings" on restaurant_settings for select using (true);
drop policy if exists "demo_write_restaurant_settings" on restaurant_settings;
create policy "demo_write_restaurant_settings" on restaurant_settings for all using (true) with check (true);

drop policy if exists "demo_read_menu_items" on menu_items;
create policy "demo_read_menu_items" on menu_items for select using (true);
drop policy if exists "demo_write_menu_items" on menu_items;
create policy "demo_write_menu_items" on menu_items for all using (true) with check (true);

drop policy if exists "demo_read_profiles" on profiles;
create policy "demo_read_profiles" on profiles for select using (true);
drop policy if exists "demo_write_profiles" on profiles;
create policy "demo_write_profiles" on profiles for all using (true) with check (true);

drop policy if exists "demo_read_user_addresses" on user_addresses;
create policy "demo_read_user_addresses" on user_addresses for select using (true);
drop policy if exists "demo_write_user_addresses" on user_addresses;
create policy "demo_write_user_addresses" on user_addresses for all using (true) with check (true);

drop policy if exists "demo_read_user_cards" on user_cards;
create policy "demo_read_user_cards" on user_cards for select using (true);
drop policy if exists "demo_write_user_cards" on user_cards;
create policy "demo_write_user_cards" on user_cards for all using (true) with check (true);

drop policy if exists "demo_read_orders" on orders;
create policy "demo_read_orders" on orders for select using (true);
drop policy if exists "demo_write_orders" on orders;
create policy "demo_write_orders" on orders for all using (true) with check (true);

drop policy if exists "demo_read_order_items" on order_items;
create policy "demo_read_order_items" on order_items for select using (true);
drop policy if exists "demo_write_order_items" on order_items;
create policy "demo_write_order_items" on order_items for all using (true) with check (true);

drop policy if exists "demo_read_order_status_events" on order_status_events;
create policy "demo_read_order_status_events" on order_status_events for select using (true);
drop policy if exists "demo_write_order_status_events" on order_status_events;
create policy "demo_write_order_status_events" on order_status_events for all using (true) with check (true);

drop policy if exists "demo_read_bonus_accounts" on bonus_accounts;
create policy "demo_read_bonus_accounts" on bonus_accounts for select using (true);
drop policy if exists "demo_write_bonus_accounts" on bonus_accounts;
create policy "demo_write_bonus_accounts" on bonus_accounts for all using (true) with check (true);

drop policy if exists "demo_read_bonus_transactions" on bonus_transactions;
create policy "demo_read_bonus_transactions" on bonus_transactions for select using (true);
drop policy if exists "demo_write_bonus_transactions" on bonus_transactions;
create policy "demo_write_bonus_transactions" on bonus_transactions for all using (true) with check (true);

drop policy if exists "demo_read_bookings" on bookings;
create policy "demo_read_bookings" on bookings for select using (true);
drop policy if exists "demo_write_bookings" on bookings;
create policy "demo_write_bookings" on bookings for all using (true) with check (true);

-- Optional auto-cleanup in Supabase, if pg_cron is enabled in your project:
-- create extension if not exists pg_cron;
-- select cron.schedule(
--   'restaurant_cleanup_completed_orders',
--   '0 4 * * *',
--   $$select cleanup_completed_orders(30);$$
-- );

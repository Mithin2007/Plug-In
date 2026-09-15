-- ChargeConnect initial schema
--
-- This migration is written for Supabase PostgreSQL. It intentionally models
-- availability separately from reservations: a reservation is assigned to a
-- concrete slot, allowing PostgreSQL to reject overlapping bookings safely.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

create type public.app_role as enum ('USER', 'OWNER', 'ADMIN');
create type public.station_type as enum ('PUBLIC', 'COMMUNITY');
create type public.connector_type as enum ('CCS2', 'TYPE2', 'CHADEMO', 'GB_T', 'TESLA', 'OTHER');
create type public.station_status as enum ('AVAILABLE', 'LIMITED', 'OCCUPIED', 'OFFLINE', 'MAINTENANCE');
create type public.verification_status as enum ('PENDING', 'VERIFIED', 'REJECTED');
create type public.slot_state as enum ('AVAILABLE', 'CHARGING', 'OFFLINE', 'MAINTENANCE');
create type public.reservation_status as enum ('CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');
create type public.report_reason as enum (
  'CHARGER_NOT_WORKING',
  'WRONG_LOCATION',
  'INCORRECT_AVAILABILITY',
  'ALREADY_OCCUPIED',
  'INCORRECT_INFORMATION',
  'OTHER'
);
create type public.report_status as enum ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
create type public.session_source as enum ('DEMO_SIMULATION', 'MANUAL', 'OCPP');
create type public.session_status as enum ('ACTIVE', 'COMPLETED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'ChargeConnect member'
    check (char_length(btrim(display_name)) between 2 and 80),
  email text,
  avatar_url text,
  phone text,
  vehicle_make text,
  vehicle_model text,
  default_connector public.connector_type,
  role public.app_role not null default 'USER',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.charging_stations (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 140),
  description text not null default '' check (char_length(description) <= 3000),
  address text not null check (char_length(btrim(address)) between 5 and 500),
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  station_type public.station_type not null default 'PUBLIC',
  connector_type public.connector_type not null,
  charging_speed_kw numeric(7, 2) not null check (charging_speed_kw > 0 and charging_speed_kw <= 1000),
  price_per_kwh numeric(8, 2) not null default 0 check (price_per_kwh >= 0 and price_per_kwh <= 10000),
  total_slots integer not null check (total_slots between 1 and 100),
  available_slots integer not null default 0 check (available_slots between 0 and total_slots),
  status public.station_status not null default 'AVAILABLE',
  opening_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(opening_hours) = 'object'),
  amenities text[] not null default '{}'::text[],
  is_community boolean not null default false,
  verification_status public.verification_status not null default 'PENDING',
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_station_shape check (
    (station_type = 'COMMUNITY' and is_community and owner_id is not null)
    or (station_type = 'PUBLIC' and not is_community)
  )
);

create table public.station_slots (
  id uuid primary key default extensions.gen_random_uuid(),
  station_id uuid not null references public.charging_stations(id) on delete cascade,
  slot_number integer not null check (slot_number > 0),
  current_state public.slot_state not null default 'AVAILABLE',
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, slot_number)
);

create table public.reservations (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  station_id uuid not null references public.charging_stations(id) on delete restrict,
  slot_id uuid not null references public.station_slots(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.reservation_status not null default 'CONFIRMED',
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservation_time_range check (end_time > start_time),
  constraint cancellation_timestamp check (
    (status = 'CANCELLED' and cancelled_at is not null)
    or (status <> 'CANCELLED')
  )
);

-- A slot is the concurrency boundary. Two confirmed or active reservations may
-- never overlap on it; the reservation RPC chooses a free slot transactionally.
alter table public.reservations
  add constraint reservations_no_slot_overlap
  exclude using gist (
    slot_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status in ('CONFIRMED', 'ACTIVE'));

create table public.charging_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  station_id uuid not null references public.charging_stations(id) on delete restrict,
  slot_id uuid not null references public.station_slots(id) on delete restrict,
  reservation_id uuid references public.reservations(id) on delete set null,
  source public.session_source not null default 'MANUAL',
  status public.session_status not null default 'ACTIVE',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_time_range check (ended_at is null or ended_at >= started_at),
  constraint completed_session_has_end_time check (
    (status = 'ACTIVE' and ended_at is null)
    or (status = 'COMPLETED' and ended_at is not null)
  )
);

create unique index charging_sessions_one_active_slot_idx
  on public.charging_sessions(slot_id)
  where status = 'ACTIVE';

create table public.availability_events (
  id uuid primary key default extensions.gen_random_uuid(),
  station_id uuid not null references public.charging_stations(id) on delete cascade,
  slot_id uuid not null references public.station_slots(id) on delete cascade,
  previous_state public.slot_state,
  new_state public.slot_state not null,
  source public.session_source not null default 'MANUAL',
  actor_id uuid references public.profiles(id) on delete set null,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  station_id uuid not null references public.charging_stations(id) on delete cascade,
  reservation_id uuid not null unique references public.reservations(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  station_id uuid not null references public.charging_stations(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  reason public.report_reason not null,
  description text not null check (char_length(btrim(description)) between 5 and 2000),
  evidence_url text,
  status public.report_status not null default 'OPEN',
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 2000),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorite_stations (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  station_id uuid not null references public.charging_stations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, station_id)
);

create index charging_stations_discovery_idx
  on public.charging_stations (verification_status, status, station_type, connector_type);
create index charging_stations_owner_idx on public.charging_stations (owner_id) where owner_id is not null;
create index station_slots_station_state_idx on public.station_slots (station_id, current_state) where is_enabled;
create index reservations_user_start_idx on public.reservations (user_id, start_time desc);
create index reservations_station_start_idx on public.reservations (station_id, start_time);
create index reservations_slot_start_idx on public.reservations (slot_id, start_time);
create index charging_sessions_station_status_idx on public.charging_sessions (station_id, status, started_at desc);
create index availability_events_station_created_idx on public.availability_events (station_id, created_at desc);
create index reviews_station_created_idx on public.reviews (station_id, created_at desc);
create index reports_station_status_idx on public.reports (station_id, status, created_at desc);

comment on table public.station_slots is 'Internal reservable charging bays. Slot assignment prevents reservation races.';
comment on table public.charging_sessions is 'Current sessions; DEMO_SIMULATION is explicitly non-telemetry prototype data.';
comment on table public.availability_events is 'Audit log for slot state changes and demo simulation actions.';
comment on column public.charging_stations.available_slots is 'Cached availability now, maintained from enabled slot state. Use get_station_availability for a requested booking window.';

commit;

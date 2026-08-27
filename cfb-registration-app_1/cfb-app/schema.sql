-- Church Futsal Brothers — registration schema
-- Run this in Supabase: Project → SQL Editor → New query → paste → Run

create extension if not exists "pgcrypto";

create table teams (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  team_name text not null,
  jersey_colour text,
  combined boolean default false,
  church1 text not null,
  branch1 text,
  pastor1_name text not null,
  pastor1_contact text not null,
  church2 text,
  branch2 text,
  pastor2_name text,
  pastor2_contact text,
  endorsement_photo_url text
);

create table people (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  team_id uuid references teams(id) on delete cascade,
  role text not null check (role in ('manager', 'assistant', 'player')),
  squad_number int,
  full_name text not null,
  dob date,
  church text,
  phone text,
  member_since text,
  photo_url text,
  signed_name text
);

-- Row Level Security: allow anonymous read/write since this is an
-- internal registration tool with no login. Tighten later if needed
-- (e.g. restrict writes once registration closes).
alter table teams enable row level security;
alter table people enable row level security;

create policy "anyone can read teams" on teams for select using (true);
create policy "anyone can insert teams" on teams for insert with check (true);

create policy "anyone can read people" on people for select using (true);
create policy "anyone can insert people" on people for insert with check (true);

-- Storage bucket for photos (players, managers, endorsement pages).
-- Create this in the Supabase dashboard: Storage → New bucket → name it
-- "photos" → toggle "Public bucket" ON (so uploaded images can be viewed
-- without extra auth). Then run this policy so uploads are allowed:

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "anyone can upload photos" on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "anyone can view photos" on storage.objects
  for select using (bucket_id = 'photos');

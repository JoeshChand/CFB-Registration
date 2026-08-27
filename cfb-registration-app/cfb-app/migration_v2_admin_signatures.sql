-- Migration v2: signatures + admin-only roster access
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run even if you already have data — it only adds columns
-- and swaps who's allowed to READ the tables (public can still submit).

-- 1. New columns for drawn signatures (players/managers) and
--    pastor signatures at the team level.
alter table people add column if not exists signature_url text;
alter table teams add column if not exists pastor1_signature_url text;
alter table teams add column if not exists pastor2_signature_url text;

-- 2. Lock down reads: only a logged-in admin can view registrations.
--    Registration itself stays open to everyone (insert policies
--    from schema.sql are untouched).
drop policy if exists "anyone can read teams" on teams;
drop policy if exists "anyone can read people" on people;

create policy "authenticated can read teams" on teams
  for select using (auth.role() = 'authenticated');

create policy "authenticated can read people" on people
  for select using (auth.role() = 'authenticated');

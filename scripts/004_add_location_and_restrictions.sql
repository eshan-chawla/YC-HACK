-- Add location and restrictions columns to events table
alter table public.events
  add column if not exists location text,
  add column if not exists restrictions text;

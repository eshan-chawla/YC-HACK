-- Create events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text not null,
  event_date timestamp with time zone not null,
  event_time time not null,
  budget_per_person numeric(10, 2) not null,
  employees jsonb not null default '[]'::jsonb,
  total_budget numeric(10, 2) generated always as (budget_per_person * jsonb_array_length(employees)) stored,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.events enable row level security;

-- Create policies (allowing all users to read/write for now - adjust based on your auth needs)
create policy "events_select_all"
  on public.events for select
  using (true);

create policy "events_insert_all"
  on public.events for insert
  with check (true);

create policy "events_update_all"
  on public.events for update
  using (true);

create policy "events_delete_all"
  on public.events for delete
  using (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_updated_at
  before update on public.events
  for each row
  execute function public.handle_updated_at();

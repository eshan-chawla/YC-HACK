-- Create trips table
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  price numeric(10, 2),
  trip_details text,
  status text not null default 'pending' check (status in ('pending', 'booked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.trips enable row level security;

-- Create policies
create policy "trips_select_all"
  on public.trips for select
  using (true);

create policy "trips_insert_all"
  on public.trips for insert
  with check (true);

create policy "trips_update_all"
  on public.trips for update
  using (true);

create policy "trips_delete_all"
  on public.trips for delete
  using (true);

-- Create updated_at trigger
create trigger trips_updated_at
  before update on public.trips
  for each row
  execute function public.handle_updated_at();

-- Create index for faster queries
create index trips_event_id_idx on public.trips(event_id);
create index trips_employee_id_idx on public.trips(employee_id);

-- Create employees table
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  team text not null,
  location text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.employees enable row level security;

-- Create policies
create policy "employees_select_all"
  on public.employees for select
  using (true);

create policy "employees_insert_all"
  on public.employees for insert
  with check (true);

create policy "employees_update_all"
  on public.employees for update
  using (true);

create policy "employees_delete_all"
  on public.employees for delete
  using (true);

-- Insert dummy data
insert into public.employees (name, email, team, location) values
  ('John Smith', 'john.smith@company.com', 'Engineering', 'San Francisco'),
  ('Sarah Johnson', 'sarah.johnson@company.com', 'Engineering', 'New York'),
  ('Michael Brown', 'michael.brown@company.com', 'Product', 'Austin'),
  ('Emily Davis', 'emily.davis@company.com', 'Design', 'Los Angeles'),
  ('David Wilson', 'david.wilson@company.com', 'Sales', 'Chicago'),
  ('Lisa Martinez', 'lisa.martinez@company.com', 'Marketing', 'Miami'),
  ('James Anderson', 'james.anderson@company.com', 'Engineering', 'Seattle'),
  ('Jennifer Taylor', 'jennifer.taylor@company.com', 'Operations', 'Boston'),
  ('Robert Thomas', 'robert.thomas@company.com', 'Finance', 'Denver'),
  ('Maria Garcia', 'maria.garcia@company.com', 'HR', 'San Diego');

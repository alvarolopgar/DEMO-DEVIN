-- =============================================================
-- Task Manager Database Schema
-- =============================================================
-- Run this SQL in the Supabase SQL Editor to set up your database.
-- =============================================================

-- 1. Create the tasks table
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Create an index on user_id for fast lookups
create index if not exists tasks_user_id_idx on public.tasks(user_id);

-- 3. Enable Row Level Security (RLS)
alter table public.tasks enable row level security;

-- 4. RLS Policies: Users can only access their own tasks
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can create their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- 5. Auto-update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_task_updated
  before update on public.tasks
  for each row execute function public.handle_updated_at();

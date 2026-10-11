-- En qué la gasto: proyectos de ahorro (etapa 3)
-- Se corre una vez en Supabase: SQL Editor > New query > pegar y ejecutar.
-- Se puede volver a correr sin problema.

-- Objetivos de ahorro (un viaje, un auto...). for_member vacío = compartido.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text not null default '',
  target_amount numeric(14,2) not null default 0 check (target_amount >= 0),
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  for_member uuid references public.members(id) on delete set null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "hogar: proyectos" on public.projects;
create policy "hogar: proyectos" on public.projects
  for all using (public.is_member(household_id)) with check (public.is_member(household_id));

-- Cada aporte a un proyecto es un movimiento de ahorro (tipo "transferencia")
-- que descuenta del disponible. project_amount es lo que suma al proyecto en su
-- moneda, por ejemplo US$ 200 comprados con $ 280.000. Vacío = el mismo importe.
alter table public.transactions
  add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.transactions
  add column if not exists project_amount numeric(14,2) check (project_amount >= 0);

create index if not exists transactions_project on public.transactions (project_id);

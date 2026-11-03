-- En qué la gasto: presupuestos por categoría y fondo de emergencia
-- Se corre una vez en Supabase: SQL Editor > New query > pegar y ejecutar.
-- Se puede volver a correr sin problema.

-- Tope mensual de gasto por categoría. Sin fila = sin presupuesto.
create table if not exists public.category_budgets (
  category_id uuid primary key references public.categories(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0)
);

alter table public.category_budgets enable row level security;

drop policy if exists "hogar: presupuestos" on public.category_budgets;
create policy "hogar: presupuestos" on public.category_budgets
  for all using (public.is_member(household_id)) with check (public.is_member(household_id));

-- Fondo de emergencia del hogar: cuántos meses de gastos esenciales se quieren
-- cubrir y el proyecto donde se junta. usd_rate es la cotización para calcular
-- los meses cubiertos cuando el fondo está en dólares.
create table if not exists public.emergency_funds (
  household_id uuid primary key references public.households(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  months integer not null default 6 check (months between 1 and 24),
  usd_rate numeric(14,2) check (usd_rate > 0)
);

alter table public.emergency_funds enable row level security;

drop policy if exists "hogar: fondo de emergencia" on public.emergency_funds;
create policy "hogar: fondo de emergencia" on public.emergency_funds
  for all using (public.is_member(household_id)) with check (public.is_member(household_id));

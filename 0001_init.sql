-- En qué la gasto: esquema inicial (etapa 1)
-- Se corre una vez en Supabase: SQL Editor > New query > pegar y ejecutar.

create extension if not exists pgcrypto;

-- Hogar compartido
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  currency text not null default 'ARS',
  created_at timestamptz not null default now()
);

-- Miembros del hogar. user_id queda vacío hasta que la persona se une con el código.
create table public.members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  monthly_income numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  emoji text not null default '📦',
  kind text not null default 'egreso' check (kind in ('egreso', 'ingreso')),
  essential boolean not null default false,
  archived boolean not null default false,
  sort integer not null default 0,
  unique (household_id, name)
);

-- Cuentas o medios de pago (Mercado Pago, banco, efectivo...)
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  archived boolean not null default false,
  unique (household_id, name)
);

-- Plantilla de gastos fijos del mes (alquiler, expensas, suscripciones...)
create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  description text not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(14,2) not null default 0,
  due_day smallint check (due_day between 1 and 31),
  paid_by uuid references public.members(id) on delete set null,
  for_member uuid references public.members(id) on delete set null, -- null = compartido
  account_id uuid references public.accounts(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cada ingreso, gasto o transferencia
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('ingreso', 'egreso', 'transferencia')),
  status text not null default 'pagado' check (status in ('pagado', 'pendiente')),
  paid_by uuid references public.members(id) on delete set null,
  for_member uuid references public.members(id) on delete set null, -- null = compartido
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  account_id uuid references public.accounts(id) on delete set null,
  fixed_expense_id uuid references public.fixed_expenses(id) on delete set null,
  note text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index transactions_household_date on public.transactions (household_id, date desc);
create index transactions_fixed on public.transactions (fixed_expense_id, date);

-- ¿El usuario logueado es miembro de este hogar?
create or replace function public.is_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members where household_id = hid and user_id = auth.uid()
  );
$$;

alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.transactions enable row level security;

create policy "miembros ven su hogar" on public.households
  for select using (public.is_member(id));
create policy "miembros editan su hogar" on public.households
  for update using (public.is_member(id)) with check (public.is_member(id));

create policy "miembros ven miembros" on public.members
  for select using (public.is_member(household_id));
create policy "miembros editan miembros" on public.members
  for update using (public.is_member(household_id)) with check (public.is_member(household_id));

create policy "hogar: categorias" on public.categories
  for all using (public.is_member(household_id)) with check (public.is_member(household_id));
create policy "hogar: cuentas" on public.accounts
  for all using (public.is_member(household_id)) with check (public.is_member(household_id));
create policy "hogar: fijos" on public.fixed_expenses
  for all using (public.is_member(household_id)) with check (public.is_member(household_id));
create policy "hogar: movimientos" on public.transactions
  for all using (public.is_member(household_id)) with check (public.is_member(household_id));

-- Crea el hogar con los dos miembros, categorías y cuentas iniciales.
create or replace function public.create_household(household_name text, my_name text, partner_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  if auth.uid() is null then
    raise exception 'No hay sesión iniciada';
  end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'Ya formás parte de un hogar';
  end if;

  insert into public.households (name) values (household_name) returning id into hid;
  insert into public.members (household_id, user_id, name) values (hid, auth.uid(), my_name);
  if coalesce(trim(partner_name), '') <> '' then
    insert into public.members (household_id, name) values (hid, partner_name);
  end if;

  insert into public.categories (household_id, name, emoji, kind, essential, sort) values
    (hid, 'Vivienda', '🏠', 'egreso', true, 1),
    (hid, 'Comida', '🛒', 'egreso', true, 2),
    (hid, 'Auto', '🚗', 'egreso', true, 3),
    (hid, 'Deudas', '💳', 'egreso', true, 4),
    (hid, 'Suscripciones', '📺', 'egreso', false, 5),
    (hid, 'Celular', '📱', 'egreso', true, 6),
    (hid, 'Educación', '📚', 'egreso', true, 7),
    (hid, 'Salidas y ocio', '🍿', 'egreso', false, 8),
    (hid, 'Hogar', '🛋️', 'egreso', false, 9),
    (hid, 'Personal y regalos', '🎁', 'egreso', false, 10),
    (hid, 'Otros', '📦', 'egreso', false, 11),
    (hid, 'Sueldo', '💼', 'ingreso', false, 20),
    (hid, 'Otros ingresos', '💰', 'ingreso', false, 21);

  insert into public.accounts (household_id, name, currency) values
    (hid, 'Mercado Pago', 'ARS'),
    (hid, 'Banco', 'ARS'),
    (hid, 'Transferencia', 'ARS'),
    (hid, 'Efectivo', 'ARS'),
    (hid, 'Dólares', 'USD');

  return hid;
end;
$$;

-- Unirse a un hogar con el código de invitación. Toma el lugar del miembro
-- que todavía no tiene usuario (por ejemplo "Laila") o crea uno nuevo.
create or replace function public.join_household(code text, my_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  mid uuid;
begin
  if auth.uid() is null then
    raise exception 'No hay sesión iniciada';
  end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'Ya formás parte de un hogar';
  end if;

  select id into hid from public.households where invite_code = upper(trim(code));
  if hid is null then
    raise exception 'Código de invitación inválido';
  end if;

  select id into mid from public.members
    where household_id = hid and user_id is null
    order by created_at limit 1;

  if mid is null then
    insert into public.members (household_id, user_id, name) values (hid, auth.uid(), my_name);
  else
    update public.members set user_id = auth.uid() where id = mid;
  end if;

  return hid;
end;
$$;

grant execute on function public.create_household(text, text, text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;

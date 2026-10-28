-- En qué la gasto: entrar con nombre y PIN, e invitar a más de una persona
-- Se corre una vez en Supabase: SQL Editor > New query > pegar y ejecutar.
-- Se puede volver a correr sin problema.

-- Cuentas que entran con nombre y PIN. El nombre es único en toda la app
-- (sin importar mayúsculas). El PIN se guarda hasheado desde el servidor.
-- Sin políticas de RLS: solo la clave secreta del servidor puede leerla.
create table if not exists public.pin_logins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  pin_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists pin_logins_username on public.pin_logins (lower(username));

alter table public.pin_logins enable row level security;
revoke all on public.pin_logins from anon, authenticated;

-- Suma una persona al hogar de quien la invita. Queda sin usuario hasta que
-- entra con el código y este nombre.
create or replace function public.add_member(member_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  mid uuid;
begin
  select household_id into hid from public.members where user_id = auth.uid();
  if hid is null then
    raise exception 'No formás parte de un hogar';
  end if;
  if coalesce(trim(member_name), '') = '' then
    raise exception 'Poné un nombre';
  end if;
  if exists (
    select 1 from public.members where household_id = hid and lower(name) = lower(trim(member_name))
  ) then
    raise exception 'Ya hay alguien con ese nombre en el hogar';
  end if;

  insert into public.members (household_id, name) values (hid, trim(member_name)) returning id into mid;
  return mid;
end;
$$;

-- Saca una invitación que todavía nadie usó.
create or replace function public.remove_pending_member(member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.members
    where id = member_id
      and user_id is null
      and public.is_member(household_id);
end;
$$;

-- Unirse con el código: toma el lugar de la persona invitada con ese nombre.
-- Si no hay ninguna con ese nombre y queda una sola invitación libre, toma esa;
-- si no, se suma como persona nueva.
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
    where household_id = hid and user_id is null and lower(name) = lower(trim(my_name))
    order by created_at limit 1;

  if mid is null and (select count(*) from public.members where household_id = hid and user_id is null) = 1 then
    select id into mid from public.members where household_id = hid and user_id is null;
  end if;

  if mid is null then
    insert into public.members (household_id, user_id, name) values (hid, auth.uid(), trim(my_name));
  else
    update public.members set user_id = auth.uid() where id = mid;
  end if;

  return hid;
end;
$$;

grant execute on function public.add_member(text) to authenticated;
grant execute on function public.remove_pending_member(uuid) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;

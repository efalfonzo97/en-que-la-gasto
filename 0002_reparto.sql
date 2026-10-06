-- En qué la gasto: reparto de gastos compartidos (etapa 2)
-- Se corre una vez en Supabase: SQL Editor > New query > pegar y ejecutar.
-- Se puede volver a correr sin problema.

-- Porcentaje de cada miembro en un gasto compartido, por ejemplo
-- {"<id de Esteban>": 60, "<id de Laila>": 40}.
-- Vacío (null) significa partes iguales (50/50).
alter table public.transactions add column if not exists shares jsonb;
alter table public.fixed_expenses add column if not exists shares jsonb;

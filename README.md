# En qué la gasto

App para llevar las finanzas del hogar entre dos: cada uno carga sus movimientos desde su cuenta, se ven los gastos fijos del mes, en qué se gasta y cuánto pone cada uno en lo compartido.

Stack: Next.js (App Router) en Vercel + Supabase (Auth y Postgres con RLS).

## Etapa 1 (esta versión)

- Login con email y contraseña; un hogar compartido con código de invitación.
- Cargar ingresos, gastos y ahorros: categoría con emoji, quién pagó, para quién (o compartido), medio de pago, pendiente o pagado.
- Fijos del mes: alquiler, servicios y suscripciones como checklist; "Pagado" crea el movimiento.
- Inicio: disponible del mes, lo que falta pagar, cuánto puso cada uno en lo compartido y la diferencia, gasto por categoría.
- Movimientos: lista por mes con filtros, editar y borrar.
- Ajustes: categorías (crear, editar emoji, archivar), medios de pago, ingresos de cada uno, código de invitación.
- Importar la hoja "Cuentas" del Excel: filas con fecha como movimientos, filas sin fecha como gastos fijos.

## Puesta en marcha

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor > New query**, pegar el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecutarlo. Después hacer lo mismo con [`supabase/migrations/0002_reparto.sql`](supabase/migrations/0002_reparto.sql).
3. En **Authentication > URL Configuration**, poner la URL de Vercel como *Site URL* (por ejemplo `https://en-que-la-gasto.vercel.app`) y agregar `https://en-que-la-gasto.vercel.app/**` en *Redirect URLs*.
4. En **Project Settings > API** copiar la *Project URL* y la clave *anon / publishable*.

### 2. Vercel

1. Importar el repo de GitHub en [vercel.com/new](https://vercel.com/new).
2. Agregar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.

### 3. Primer uso

1. Esteban crea su cuenta, crea el hogar y pone el nombre de su pareja.
2. En **Ajustes** está el código de invitación: Laila crea su cuenta, elige "Unirme con un código" y lo pega.
3. En **Ajustes > Importar Excel** se sube `Finanzas.xlsm` una sola vez.

En el celular: abrir la app en el navegador y "Agregar a pantalla de inicio" para usarla como app.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase
npm run dev
```

Con Docker se puede levantar Supabase local con `npx supabase start` (aplica las migraciones de `supabase/migrations`) y usar la URL y la clave que imprime.

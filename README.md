# En qué la gasto

App para llevar las finanzas del hogar entre dos: cada uno carga sus movimientos desde su cuenta, se ven los gastos fijos del mes, en qué se gasta y cuánto pone cada uno en lo compartido.

Stack: Next.js (App Router) en Vercel + Supabase (Auth y Postgres con RLS).

## Etapa 1 (esta versión)

- Se entra con nombre y PIN; un hogar compartido con código de invitación para sumar a todas las personas que haga falta. Email opcional en el perfil para recuperar el PIN.
- Cargar ingresos, gastos y ahorros: categoría con emoji, quién pagó, para quién (o compartido), medio de pago, pendiente o pagado.
- Fijos del mes: alquiler, servicios y suscripciones como checklist; "Pagado" crea el movimiento.
- Inicio: disponible del mes, lo que falta pagar, cuánto puso cada uno en lo compartido y la diferencia, gasto por categoría.
- Movimientos: lista por mes con filtros, editar y borrar.
- Ajustes: categorías (crear, editar emoji, archivar), medios de pago, ingresos de cada uno, código de invitación.
- Importar la hoja "Cuentas" del Excel: filas con fecha como movimientos, filas sin fecha como gastos fijos.

## Puesta en marcha

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor > New query**, pegar el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecutarlo. Después hacer lo mismo, en orden, con [`0002_reparto.sql`](supabase/migrations/0002_reparto.sql), [`0003_proyectos.sql`](supabase/migrations/0003_proyectos.sql) y [`0004_acceso_pin.sql`](supabase/migrations/0004_acceso_pin.sql).
3. En **Authentication > URL Configuration**, poner la URL de Vercel como *Site URL* (por ejemplo `https://en-que-la-gasto.vercel.app`) y agregar `https://en-que-la-gasto.vercel.app/**` en *Redirect URLs*.
   "¿Olvidaste tu PIN?" funciona sin tocar nada más si el link se abre en el mismo dispositivo donde se pidió. Para que funcione desde cualquiera, cambiar el link del template en **Authentication > Emails > Reset password** por `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Elegir PIN nuevo</a>`. Supabase solo deja editar los templates con un SMTP propio (por ejemplo Resend), configurado en **Authentication > Emails > SMTP Settings**.
4. En **Project Settings > API** copiar la *Project URL*, la clave *anon / publishable* y la clave *service_role / secret*. La secreta la usa solo el servidor para las cuentas con nombre y PIN (que no tienen email); nunca va en una variable `NEXT_PUBLIC_`.

### 2. Vercel

1. Importar el repo de GitHub en [vercel.com/new](https://vercel.com/new).
2. Agregar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy.

### 3. Primer uso

1. Esteban toca "Crear usuario", elige nombre y PIN, crea el hogar y pone el nombre de su pareja.
2. En **Ajustes > Personas del hogar** se puede anotar a más gente con el nombre que va a usar. Cada invitado toca "Tengo un código de invitación", pone el código de **Ajustes**, su nombre tal como lo anotaron y elige un PIN. Después entra con ese nombre y PIN.
3. En **Ajustes > Cuenta** cada uno puede cargar un email para recuperar el PIN si se lo olvida.

Las cuentas creadas antes con email ven un aviso para elegir nombre y PIN. Si ya cerraron sesión, en "¿Olvidaste tu PIN?" pueden escribir su email: les llega el link y eligen nombre y PIN.
4. En **Ajustes > Importar Excel** se sube `Finanzas.xlsm` una sola vez.

En el celular: abrir la app en el navegador y "Agregar a pantalla de inicio" para usarla como app.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase
npm run dev
```

Con Docker se puede levantar Supabase local con `npx supabase start` (aplica las migraciones de `supabase/migrations`) y usar la URL y la clave que imprime.

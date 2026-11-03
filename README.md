# En qué la gasto

App para llevar las finanzas del hogar entre dos: cada uno carga sus movimientos desde su cuenta, se ven los gastos fijos del mes, en qué se gasta y cuánto pone cada uno en lo compartido.

Stack: Next.js (App Router) en Vercel + Supabase (Auth y Postgres con RLS).

## Qué hace

- Login con email y contraseña; un hogar compartido con código de invitación.
- Cargar ingresos, gastos y ahorros: categoría con emoji, quién pagó, para quién (o compartido, con reparto en %), medio de pago, pendiente o pagado.
- Inicio: disponible del mes, lo que falta pagar, cuánto puso cada uno en lo compartido y la diferencia, fondo de emergencia, presupuestos y proyectos.
- Movimientos: por mes u otro período, con gráfico por categoría, % del sueldo gastado, filtros, editar y borrar. Adentro, los fijos del mes como checklist ("Pagado" crea el movimiento).
- Proyectos: objetivos de ahorro en pesos o dólares; cada aporte es un movimiento de ahorro.
- Fondo de emergencia: calcula cuánto gastan por mes en las categorías esenciales, propone una meta (3 a 12 meses) y muestra cuántos meses cubre lo juntado.
- Presupuestos: un tope mensual por categoría, con aviso al llegar al 80% y al pasarse.
- Ajustes: categorías (crear, editar emoji, marcar esencial, archivar), medios de pago, ingresos de cada uno, código de invitación.
- Importar la hoja "Cuentas" del Excel: filas con fecha como movimientos, filas sin fecha como gastos fijos.

## Puesta en marcha

### 1. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor > New query**, pegar y ejecutar, en orden, cada archivo de [`supabase/migrations`](supabase/migrations):
   - `0001_init.sql`
   - `0002_reparto.sql`
   - `0003_proyectos.sql`
   - `0005_presupuestos_emergencia.sql` (presupuestos y fondo de emergencia)

   Todos se pueden volver a correr sin problema. En un proyecto que ya estaba andando, alcanza con correr los que falten.
3. En **Authentication > URL Configuration**, poner la URL de Vercel como *Site URL* (por ejemplo `https://en-que-la-gasto.vercel.app`) y agregar `https://en-que-la-gasto.vercel.app/**` en *Redirect URLs*.
   "¿Olvidaste tu contraseña?" funciona sin tocar nada más si el link se abre en el mismo dispositivo donde se pidió. Para que funcione desde cualquiera, cambiar el link del template en **Authentication > Emails > Reset password** por `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Elegir contraseña nueva</a>`. Supabase solo deja editar los templates con un SMTP propio (por ejemplo Resend), configurado en **Authentication > Emails > SMTP Settings**.
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

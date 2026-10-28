import Link from "next/link";
import { getContext } from "@/lib/data";
import { signOut } from "@/app/login/actions";
import { isPinEmail } from "@/lib/pin";
import { pinLoginOf } from "@/lib/pin-login";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChangePinForm, InviteForm, RecoveryEmailForm } from "./forms";
import {
  removePendingMember,
  saveAccount,
  saveCategory,
  toggleAccountArchived,
  toggleCategoryArchived,
  updateHousehold,
  updateMember,
} from "../actions";

export default async function SettingsPage() {
  const ctx = await getContext();
  const pending = ctx.members.filter((m) => !m.user_id);
  const { data: claims } = await ctx.supabase.auth.getClaims();
  const email = claims?.claims?.email;
  const login = await pinLoginOf(createAdminClient(), ctx.userId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <section className="card space-y-3">
        <h2 className="font-semibold">Hogar</h2>
        <form action={updateHousehold} className="flex gap-2">
          <input className="input" name="name" defaultValue={ctx.household.name} aria-label="Nombre del hogar" />
          <button className="btn-ghost">Guardar</button>
        </form>
        <div className="rounded-xl bg-accent-soft p-3 text-sm">
          Código para invitar: <b className="font-mono text-base tracking-widest">{ctx.household.invite_code}</b>
          <p className="text-muted">
            {pending.length
              ? `Pasale el código y su nombre a ${pending.map((m) => m.name).join(", ")}. Al entrar elige “Tengo un código de invitación”, pone los dos y elige un PIN.`
              : "Todos los invitados ya están en el hogar."}
          </p>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Personas del hogar</h2>
        <p className="text-sm text-muted">
          Anotá a cada persona con el nombre que va a usar para entrar. Podés invitar a todas las que quieras.
        </p>
        <ul className="space-y-1 text-sm">
          {ctx.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <span>
                {m.name}
                {m.id === ctx.me.id && <span className="text-muted"> (vos)</span>}
              </span>
              {m.user_id ? (
                <span className="text-xs text-accent">Ya entró</span>
              ) : (
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted">Invitación pendiente</span>
                  <form action={removePendingMember}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="text-xs text-muted underline">Quitar</button>
                  </form>
                </span>
              )}
            </li>
          ))}
        </ul>
        <InviteForm />
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Ingresos de cada uno</h2>
        <p className="text-sm text-muted">Se usa cuando en el mes no hay un ingreso cargado.</p>
        {ctx.members.map((m) => (
          <form key={m.id} action={updateMember} className="flex items-end gap-2">
            <input type="hidden" name="id" value={m.id} />
            <div className="flex-1">
              <label className="label" htmlFor={`name-${m.id}`}>Nombre</label>
              <input className="input" id={`name-${m.id}`} name="name" defaultValue={m.name} />
            </div>
            <div className="flex-1">
              <label className="label" htmlFor={`inc-${m.id}`}>Ingreso mensual</label>
              <input
                className="input"
                id={`inc-${m.id}`}
                name="monthly_income"
                inputMode="decimal"
                defaultValue={Number(m.monthly_income) ? String(m.monthly_income) : ""}
              />
            </div>
            <button className="btn-ghost">✓</button>
          </form>
        ))}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Categorías</h2>
        <ul className="space-y-2">
          {ctx.categories.map((c) => (
            <li key={c.id} className={c.archived ? "opacity-50" : ""}>
              <form action={saveCategory} className="flex items-center gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="kind" value={c.kind} />
                <input className="input w-14 px-1 text-center text-xl" name="emoji" defaultValue={c.emoji} aria-label="Emoji" />
                <input className="input flex-1" name="name" defaultValue={c.name} aria-label="Nombre" />
                {c.kind === "egreso" && (
                  <label className="flex items-center gap-1 text-xs text-muted" title="Esencial">
                    <input type="checkbox" name="essential" defaultChecked={c.essential} />
                    Esencial
                  </label>
                )}
                <button className="btn-ghost px-3" aria-label="Guardar">✓</button>
              </form>
              <form action={toggleCategoryArchived} className="text-right">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="archived" value={String(c.archived)} />
                <button className="text-xs text-muted underline">{c.archived ? "Volver a usar" : "Archivar"}</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={saveCategory} className="flex items-center gap-2 border-t border-border pt-3">
          <input className="input w-14 px-1 text-center text-xl" name="emoji" placeholder="🆕" aria-label="Emoji" />
          <input className="input flex-1" name="name" placeholder="Nueva categoría" aria-label="Nombre" required />
          <select name="kind" className="input w-28" aria-label="Tipo">
            <option value="egreso">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <button className="btn px-3" aria-label="Agregar">+</button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Medios de pago</h2>
        <ul className="space-y-1 text-sm">
          {ctx.accounts.map((a) => (
            <li key={a.id} className={`flex items-center justify-between ${a.archived ? "opacity-50" : ""}`}>
              <span>{a.name} <span className="text-muted">({a.currency})</span></span>
              <form action={toggleAccountArchived}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="archived" value={String(a.archived)} />
                <button className="text-xs text-muted underline">{a.archived ? "Volver a usar" : "Archivar"}</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={saveAccount} className="flex gap-2 border-t border-border pt-3">
          <input className="input flex-1" name="name" placeholder="Nuevo medio de pago" required aria-label="Nombre" />
          <select name="currency" className="input w-24" aria-label="Moneda">
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
          <button className="btn px-3" aria-label="Agregar">+</button>
        </form>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Importar desde Excel</h2>
        <p className="text-sm text-muted">Pasa los movimientos y los gastos fijos de la hoja Cuentas.</p>
        <Link href="/config/importar" className="btn-ghost w-full">Importar Excel</Link>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Cuenta</h2>
        {login ? (
          <>
            <p className="text-sm text-muted">Entrás como <b className="text-foreground">{login.username}</b>.</p>
            <RecoveryEmailForm email={isPinEmail(email) ? "" : (email ?? "")} />
            <ChangePinForm />
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Ya no se entra con email: elegí un nombre y un PIN para seguir entrando.</p>
            <Link href="/nueva-clave" className="btn w-full">Elegir nombre y PIN</Link>
          </>
        )}
      </section>

      <form action={signOut}>
        <button className="btn-ghost w-full">Cerrar sesión</button>
      </form>
    </div>
  );
}

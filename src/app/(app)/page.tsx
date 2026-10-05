import Link from "next/link";
import { getContext } from "@/lib/data";
import { currentMonth, formatMoney, isMonth } from "@/lib/format";
import { fixedStatus, getFixedExpenses, getMonthTransactions } from "@/lib/queries";
import { monthSummary } from "@/lib/summary";
import { MonthPicker } from "@/components/month-picker";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const month = isMonth(params.mes) ? params.mes : currentMonth();
  const ctx = await getContext();
  const [transactions, fixed] = await Promise.all([getMonthTransactions(ctx, month), getFixedExpenses(ctx)]);
  const s = monthSummary(transactions, fixedStatus(fixed, transactions), ctx.members, ctx.categories);
  const maxCategory = s.byCategory[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hola, {ctx.me.name} 👋</h1>
        <span className="text-sm text-muted">{ctx.household.name}</span>
      </div>
      {params.cargado && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm">Movimiento guardado ✓</p>}
      <MonthPicker month={month} basePath="/" />

      <section className="card space-y-3">
        <div>
          <p className="text-sm text-muted">Disponible hasta fin de mes</p>
          <p className={`text-3xl font-bold tabular-nums ${s.available < 0 ? "text-danger" : ""}`}>
            {formatMoney(s.available)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Ingresos</dt>
            <dd className="font-semibold tabular-nums text-income">{formatMoney(s.income)}</dd>
          </div>
          <div>
            <dt className="text-muted">Gastado</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(s.spent)}</dd>
          </div>
          <div>
            <dt className="text-muted">Falta pagar</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(s.pending)}</dd>
          </div>
          <div>
            <dt className="text-muted">Ahorrado</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(s.saved)}</dd>
          </div>
        </dl>
        {s.hasUsd && <p className="text-xs text-muted">Los movimientos en dólares no entran en estos totales.</p>}
      </section>

      {ctx.members.length > 1 && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Entre ustedes</h2>
          <p className="text-sm">
            {s.leader
              ? <>Este mes <b>{s.leader.name}</b> puso <b>{formatMoney(s.difference)}</b> más en lo compartido.</>
              : "Este mes pusieron lo mismo en lo compartido."}
          </p>
          <ul className="space-y-2 text-sm">
            {s.perMember.map((p) => {
              const share = s.sharedTotal ? (p.shared / s.sharedTotal) * 100 : 0;
              return (
                <li key={p.member.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{p.member.name}</span>
                    <span className="tabular-nums">{formatMoney(p.shared)} ({Math.round(share)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-border">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${share}%` }} />
                  </div>
                  <p className="text-xs text-muted">
                    Ingreso {formatMoney(p.income)}
                    {p.income > 0 && ` · puso el ${Math.round((p.shared / p.income) * 100)}% en el hogar`}
                    {p.personal > 0 && ` · gastos propios ${formatMoney(p.personal)}`}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Por pagar</h2>
          <Link href="/fijos" className="text-sm text-accent">Ver fijos</Link>
        </div>
        {s.upcoming.length === 0 ? (
          <p className="text-sm text-muted">No queda nada pendiente este mes.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {s.upcoming.slice(0, 6).map((u) => (
              <li key={u.id}>
                <Link href={u.href} className="flex justify-between">
                  <span>
                    {u.day ? <span className="text-muted">{u.day} · </span> : null}
                    {u.description}
                  </span>
                  <span className="tabular-nums">{formatMoney(u.amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">En qué la gastamos</h2>
        {s.byCategory.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay gastos este mes.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {s.byCategory.map((r) => (
              <li key={r.category.id}>
                <Link href={`/movimientos?mes=${month}&cat=${r.category.id}`} className="block space-y-1">
                  <div className="flex justify-between">
                    <span>{r.category.emoji} {r.category.name}</span>
                    <span className="tabular-nums">{formatMoney(r.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border">
                    <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(r.total / maxCategory) * 100}%` }} />
                  </div>
                </Link>
              </li>
            ))}
            {s.uncategorized > 0 && (
              <li className="flex justify-between text-muted">
                <span>Sin categoría</span>
                <span className="tabular-nums">{formatMoney(s.uncategorized)}</span>
              </li>
            )}
          </ul>
        )}
        {s.spent > 0 && (
          <p className="text-xs text-muted">
            Esenciales {formatMoney(s.essential)} · prescindibles {formatMoney(s.spent - s.essential - s.uncategorized)}
          </p>
        )}
      </section>
    </div>
  );
}

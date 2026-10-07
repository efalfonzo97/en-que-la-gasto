import Link from "next/link";
import { getContext } from "@/lib/data";
import { currentMonth, formatMoney, isMonth } from "@/lib/format";
import { fixedStatus, getFixedExpenses, getMonthTransactions } from "@/lib/queries";
import { monthSummary } from "@/lib/summary";
import { getView, withQuery } from "@/lib/view";
import { MonthPicker } from "@/components/month-picker";
import { ViewToggle } from "@/components/view-toggle";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const month = isMonth(params.mes) ? params.mes : currentMonth();
  const view = await getView(params.vista);
  const ctx = await getContext();
  const [transactions, fixed] = await Promise.all([getMonthTransactions(ctx, month), getFixedExpenses(ctx)]);
  const personal = view === "yo";
  const s = monthSummary(transactions, fixedStatus(fixed, transactions), ctx.members, ctx.categories, personal ? ctx.me.id : null);
  const mine = s.perMember.find((p) => p.member.id === ctx.me.id);
  const maxCategory = s.byCategory[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">Hola, {ctx.me.name} 👋</h1>
          <p className="text-sm text-muted">{personal ? "Viendo solo lo tuyo" : `Viendo todo ${ctx.household.name}`}</p>
        </div>
        <ViewToggle view={view} path="/" query={{ mes: params.mes ? month : null }} variant="iconos" />
      </div>
      {params.cargado && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm">Movimiento guardado ✓</p>}
      <MonthPicker month={month} basePath="/" />

      <section className="card space-y-3">
        <div>
          <p className="text-sm text-muted">Total disponible</p>
          <p className={`text-3xl font-bold tabular-nums ${s.available < 0 ? "text-danger" : ""}`}>
            {formatMoney(s.available)}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-muted">Total ingresos</dt>
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
        </dl>
        {s.saved > 0 && <p className="text-xs text-muted">El disponible ya descuenta {formatMoney(s.saved)} que se apartaron para ahorro.</p>}
        {s.hasUsd && <p className="text-xs text-muted">Los movimientos en dólares no entran en estos totales.</p>}
      </section>

      {!personal && ctx.members.length > 1 && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Entre ustedes</h2>
          <ul className="space-y-3 text-sm">
            {s.perMember.map((p) => {
              const pct = s.sharedTotal ? (p.contributed / s.sharedTotal) * 100 : 0;
              return (
                <li key={p.member.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{p.member.name}</span>
                    <span className="tabular-nums">{formatMoney(p.contributed)} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-border">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted">
                    Su parte de lo compartido {formatMoney(p.share)} · ingreso {formatMoney(p.income)}
                    {p.personal > 0 && ` · gastos propios ${formatMoney(p.personal)}`}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {personal && mine && mine.contributed + mine.share > 0 && (
        <section className="card space-y-1 text-sm">
          <h2 className="font-semibold">Tu parte de lo compartido</h2>
          <p className="tabular-nums">
            Pusiste {formatMoney(mine.contributed)} · te correspondía {formatMoney(mine.share)}
          </p>
          {Math.abs(mine.balance) >= 1 && (
            <p className="text-muted">
              {mine.balance > 0 ? `Tenés ${formatMoney(mine.balance)} a favor este mes.` : `Tu parte supera lo que pusiste en ${formatMoney(-mine.balance)}.`}
            </p>
          )}
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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{personal ? "En qué la gasté" : "En qué la gastamos"}</h2>
          <Link href={withQuery("/movimientos", { mes: month })} className="text-sm text-accent">Ver gráfico</Link>
        </div>
        {s.byCategory.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay gastos este mes.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {s.byCategory.map((r) => (
              <li key={r.category.id}>
                <Link href={withQuery("/movimientos", { mes: month, cat: r.category.id })} className="block space-y-1">
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

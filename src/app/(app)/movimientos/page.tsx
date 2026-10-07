import Link from "next/link";
import { getContext } from "@/lib/data";
import { PERIODS, addDays, formatDay, formatMoney, resolveRange } from "@/lib/format";
import { getRangeTransactions } from "@/lib/queries";
import { categoryBreakdown } from "@/lib/summary";
import { getView, isMine, withQuery } from "@/lib/view";
import { sharesLabel } from "@/lib/split";
import { CHART_COLORS, Donut } from "@/components/donut";
import { ViewToggle } from "@/components/view-toggle";

type Tab = "gastos" | "ingresos" | "todos";

export default async function TransactionsPage({ searchParams }: PageProps<"/movimientos">) {
  const params = await searchParams;
  const range = resolveRange(params);
  const view = await getView(params.vista);
  const tab: Tab = params.t === "ingresos" || params.t === "todos" ? params.t : "gastos";
  const categoryFilter = typeof params.cat === "string" ? params.cat : "";

  const ctx = await getContext();
  const all = await getRangeTransactions(ctx, range.start, range.end);
  const visible = view === "yo" ? all.filter((t) => isMine(t, ctx.me.id)) : all;

  const expenses = categoryBreakdown(visible, ctx.categories, "egreso");
  const incomes = categoryBreakdown(visible, ctx.categories, "ingreso");
  const chart = tab === "ingresos" ? incomes : expenses;

  const typeFilter = tab === "gastos" ? "egreso" : tab === "ingresos" ? "ingreso" : null;
  const transactions = visible.filter(
    (t) =>
      (!typeFilter || t.type === typeFilter) &&
      (!categoryFilter || (categoryFilter === "sin" ? !t.category_id : t.category_id === categoryFilter)),
  );
  const category = new Map(ctx.categories.map((c) => [c.id, c]));
  const member = new Map(ctx.members.map((m) => [m.id, m]));
  const byDate = new Map<string, typeof transactions>();
  for (const t of transactions) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);

  // Parámetros que se conservan al navegar.
  const base = {
    p: range.period,
    f: range.period === "periodo" ? null : range.anchor,
    desde: range.period === "periodo" ? range.start : null,
    hasta: range.period === "periodo" ? addDays(range.end, -1) : null,
    t: tab === "gastos" ? null : tab,
    cat: categoryFilter || null,
  };
  const link = (changes: Record<string, string | null>) => withQuery("/movimientos", { ...base, ...changes });
  const filteredCategory = categoryFilter ? chart.rows.find((r) => r.id === categoryFilter) ?? expenses.rows.concat(incomes.rows).find((r) => r.id === categoryFilter) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Movimientos</h1>

      <section className="card space-y-3">
        <nav className="grid grid-cols-5 gap-1 text-sm" aria-label="Período">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={withQuery("/movimientos", { p: p.value, t: base.t, cat: base.cat })}
              aria-current={range.period === p.value ? "true" : undefined}
              className={`rounded-lg py-1.5 text-center ${range.period === p.value ? "bg-accent-soft font-semibold text-accent" : "text-muted"}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {range.period === "periodo" ? (
          <form className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <input type="hidden" name="p" value="periodo" />
            {base.t && <input type="hidden" name="t" value={base.t} />}
            <div>
              <label className="label" htmlFor="desde">Desde</label>
              <input className="input py-2" type="date" id="desde" name="desde" defaultValue={range.start} />
            </div>
            <div>
              <label className="label" htmlFor="hasta">Hasta</label>
              <input className="input py-2" type="date" id="hasta" name="hasta" defaultValue={addDays(range.end, -1)} />
            </div>
            <button className="btn py-2">Ver</button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <Link href={link({ f: range.prev })} className="btn-ghost px-3 py-1.5" aria-label="Anterior">‹</Link>
            <span className="text-center font-semibold">{range.label}</span>
            <Link href={link({ f: range.next })} className="btn-ghost px-3 py-1.5" aria-label="Siguiente">›</Link>
          </div>
        )}

        <ViewToggle view={view} path="/movimientos" query={base} />

        <div className="grid grid-cols-3 gap-1 text-sm" role="group" aria-label="Tipo">
          {([
            ["gastos", "Gastos", expenses.total],
            ["ingresos", "Ingresos", incomes.total],
            ["todos", "Todos", null],
          ] as const).map(([value, label, total]) => (
            <Link
              key={value}
              href={link({ t: value === "gastos" ? null : value, cat: null })}
              aria-current={tab === value ? "true" : undefined}
              className={`rounded-lg border px-2 py-1.5 text-center ${tab === value ? "border-accent bg-accent-soft font-semibold" : "border-border text-muted"}`}
            >
              <span className="block">{label}</span>
              {total !== null && <span className="block text-xs tabular-nums">{formatMoney(total)}</span>}
            </Link>
          ))}
        </div>

        {tab === "todos" ? (
          <dl className="grid grid-cols-3 gap-2 pt-1 text-sm">
            <div>
              <dt className="text-muted">Entró</dt>
              <dd className="font-semibold tabular-nums text-income">{formatMoney(incomes.total)}</dd>
            </div>
            <div>
              <dt className="text-muted">Salió</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(expenses.total)}</dd>
            </div>
            <div>
              <dt className="text-muted">Balance</dt>
              <dd className={`font-semibold tabular-nums ${incomes.total - expenses.total < 0 ? "text-danger" : ""}`}>
                {formatMoney(incomes.total - expenses.total)}
              </dd>
            </div>
          </dl>
        ) : (
          <>
            <Donut slices={chart.rows} total={chart.total} />
            {chart.rows.length === 0 ? (
              <p className="text-center text-sm text-muted">No hay {tab} en este período.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {chart.rows.map((r, i) => {
                  const active = categoryFilter === r.id;
                  return (
                    <li key={r.id}>
                      <Link
                        href={link({ cat: active ? null : r.id })}
                        className={`flex items-center gap-3 py-2 ${categoryFilter && !active ? "opacity-50" : ""}`}
                      >
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{r.emoji} {r.name}</span>
                        <span className="w-12 text-right text-muted tabular-nums">{Math.round((r.total / chart.total) * 100)}%</span>
                        <span className="w-28 text-right font-medium tabular-nums">{formatMoney(r.total)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
        {visible.some((t) => t.currency === "USD") && <p className="text-xs text-muted">Los movimientos en dólares no entran en el gráfico ni en los totales.</p>}
      </section>

      {filteredCategory && (
        <Link href={link({ cat: null })} className="chip inline-flex items-center gap-1 border-accent bg-accent-soft">
          {filteredCategory.emoji} {filteredCategory.name} ✕
        </Link>
      )}

      {transactions.length === 0 && <p className="card text-center text-muted">No hay movimientos.</p>}

      {[...byDate.entries()].map(([date, items]) => (
        <section key={date} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted">{formatDay(date)}</h2>
          <ul className="card divide-y divide-border p-0">
            {items.map((t) => {
              const c = t.category_id ? category.get(t.category_id) : undefined;
              const sign = t.type === "ingreso" ? "+" : t.type === "egreso" ? "−" : "";
              const split = t.type === "egreso" && !t.for_member ? sharesLabel(t.shares, ctx.members) : "";
              return (
                <li key={t.id}>
                  <Link href={`/movimientos/${t.id}`} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl" aria-hidden>{c?.emoji ?? (t.type === "transferencia" ? "🔁" : "📦")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t.description || c?.name || "Sin descripción"}</span>
                      <span className="block text-xs text-muted">
                        {t.paid_by ? member.get(t.paid_by)?.name : "—"} ·{" "}
                        {t.for_member ? `para ${member.get(t.for_member)?.name}` : `compartido${split ? ` ${split}` : ""}`}
                        {t.status === "pendiente" && " · pendiente"}
                      </span>
                    </span>
                    <span className={`font-semibold tabular-nums ${t.type === "ingreso" ? "text-income" : ""}`}>
                      {sign}
                      {formatMoney(t.amount, t.currency)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

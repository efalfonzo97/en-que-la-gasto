import Link from "next/link";
import { getContext } from "@/lib/data";
import { PERIODS, addDays, formatCompact, formatDay, formatMoney, monthLabel, resolveRange } from "@/lib/format";
import { getFixedExpenses, getMonthTransactions, getProjects, getRangeTransactions } from "@/lib/queries";
import { categoryBreakdown } from "@/lib/summary";
import { getView, isMine, isMyFixed, withQuery } from "@/lib/view";
import { sharesLabel } from "@/lib/split";
import { CHART_COLORS, Donut } from "@/components/donut";
import { ViewToggle } from "@/components/view-toggle";
import { FixedList, fixedPendingInfo } from "@/components/fixed-list";
import { Gauge } from "@/components/gauge";

type Tab = "gastos" | "ingresos" | "ahorros" | "todos";
type Status = "todos" | "pagado" | "pendiente";

const STATUS_FILTERS: { value: Status; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pagado", label: "Abonados" },
  { value: "pendiente", label: "Pendientes" },
];

export default async function TransactionsPage({ searchParams }: PageProps<"/movimientos">) {
  const params = await searchParams;
  const range = resolveRange(params);
  const view = await getView(params.vista);
  const tab: Tab = params.t === "ingresos" || params.t === "ahorros" || params.t === "todos" ? params.t : "gastos";
  const categoryFilter = typeof params.cat === "string" ? params.cat : "";
  const status: Status = params.estado === "pagado" || params.estado === "pendiente" ? params.estado : "todos";

  const ctx = await getContext();
  // Los fijos se muestran del mes del período elegido.
  const fixedMonth = range.start.slice(0, 7);
  const [all, fixed, fixedMonthTx, projects] = await Promise.all([
    getRangeTransactions(ctx, range.start, range.end),
    getFixedExpenses(ctx),
    getMonthTransactions(ctx, fixedMonth),
    getProjects(ctx),
  ]);
  const fixedInfo = fixedPendingInfo(fixed, fixedMonthTx);
  const showFixed = params.fijos === "1";
  const visible = view === "yo" ? all.filter((t) => isMine(t, ctx.me.id)) : all;

  const expenses = categoryBreakdown(visible, ctx.categories, "egreso");
  const incomes = categoryBreakdown(visible, ctx.categories, "ingreso");

  // Ahorros del período, agrupados por proyecto.
  const savedList = visible.filter((t) => t.currency === "ARS" && t.status === "pagado" && t.type === "transferencia");
  const savingsRows = [
    ...projects.map((p) => ({
      id: p.id,
      name: p.title,
      emoji: "🎯",
      total: savedList.filter((t) => t.project_id === p.id).reduce((sum, t) => sum + t.amount, 0),
    })),
    {
      id: "general",
      name: "Ahorro sin proyecto",
      emoji: "🐷",
      total: savedList.filter((t) => !t.project_id || !projects.some((p) => p.id === t.project_id)).reduce((sum, t) => sum + t.amount, 0),
    },
  ]
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
  const savings = { total: savedList.reduce((sum, t) => sum + t.amount, 0), rows: savingsRows };

  const chart = tab === "ingresos" ? incomes : tab === "ahorros" ? savings : expenses;

  // Pendiente del período: gastos pendientes y, en vista por mes, los fijos sin pagar.
  const pendingTx = visible
    .filter((t) => t.currency === "ARS" && t.type === "egreso" && t.status === "pendiente")
    .reduce((sum, t) => sum + t.amount, 0);
  const visibleFixed = view === "yo" ? fixed.filter((f) => isMyFixed(f, ctx.me.id)) : fixed;
  const pendingFixed = range.period === "mes" ? fixedPendingInfo(visibleFixed, fixedMonthTx).total : 0;
  const pendingTotal = pendingTx + pendingFixed;
  const freeAfterPending = incomes.total - expenses.total - savings.total - pendingTotal;

  // Cuánto de lo que entró se gastó, y cuánto quedó como oportunidad de ahorro.
  const spentPct = incomes.total > 0 ? (expenses.total / incomes.total) * 100 : null;
  const leftover = incomes.total - expenses.total;
  const savingPct = incomes.total > 0 ? Math.max((leftover / incomes.total) * 100, 0) : null;

  const typeFilter = tab === "gastos" ? "egreso" : tab === "ingresos" ? "ingreso" : tab === "ahorros" ? "transferencia" : null;
  const matchesCategory = (t: (typeof visible)[number]) => {
    if (!categoryFilter) return true;
    if (tab === "ahorros") {
      return categoryFilter === "general"
        ? !t.project_id || !projects.some((p) => p.id === t.project_id)
        : t.project_id === categoryFilter;
    }
    return categoryFilter === "sin" ? !t.category_id : t.category_id === categoryFilter;
  };
  const byTypeAndCategory = visible.filter((t) => (!typeFilter || t.type === typeFilter) && matchesCategory(t));
  const statusCount = {
    todos: byTypeAndCategory.length,
    pagado: byTypeAndCategory.filter((t) => t.status === "pagado").length,
    pendiente: byTypeAndCategory.filter((t) => t.status === "pendiente").length,
  };
  const transactions = status === "todos" ? byTypeAndCategory : byTypeAndCategory.filter((t) => t.status === status);
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
    estado: status === "todos" ? null : status,
  };
  const link = (changes: Record<string, string | null>) => withQuery("/movimientos", { ...base, ...changes });
  const filteredCategory = categoryFilter
    ? (chart.rows as { id: string; name: string; emoji: string }[]).find((r) => r.id === categoryFilter) ??
      expenses.rows.concat(incomes.rows).find((r) => r.id === categoryFilter)
    : null;
  const openList = Boolean(categoryFilter) || status !== "todos" || params.lista === "1";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Movimientos</h1>

      <section className="card space-y-3">
        <nav className="grid grid-cols-5 gap-1 text-sm" aria-label="Período">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={withQuery("/movimientos", { p: p.value, t: base.t, cat: base.cat, estado: base.estado })}
              aria-current={range.period === p.value ? "true" : undefined}
              className={`rounded-lg py-1.5 text-center ${range.period === p.value ? "bg-accent-soft font-semibold text-accent" : "text-muted"}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {range.period === "periodo" ? (
          <form className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
            <input type="hidden" name="p" value="periodo" />
            {base.t && <input type="hidden" name="t" value={base.t} />}
            {base.estado && <input type="hidden" name="estado" value={base.estado} />}
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

        <div className="grid grid-cols-4 gap-1 text-sm" role="group" aria-label="Tipo">
          {([
            ["gastos", "Gastos", expenses.total],
            ["ingresos", "Ingresos", incomes.total],
            ["ahorros", "Ahorros", savings.total],
            ["todos", "Todos", null],
          ] as const).map(([value, label, total]) => (
            <Link
              key={value}
              href={link({ t: value === "gastos" ? null : value, cat: null })}
              aria-current={tab === value ? "true" : undefined}
              className={`min-w-0 rounded-lg border px-1 py-1.5 text-center ${tab === value ? "border-accent bg-accent-soft font-semibold" : "border-border text-muted"}`}
            >
              <span className="block">{label}</span>
              {total !== null && <span className="block truncate text-[11px] tabular-nums">{formatCompact(total)}</span>}
            </Link>
          ))}
        </div>

        {tab === "todos" ? (
          <dl className="divide-y divide-border pt-1 text-sm">
            {[
              { label: "Entró", value: incomes.total, className: "text-income" },
              { label: "Gastado", value: -expenses.total },
              { label: "Ahorrado", value: -savings.total },
              ...(pendingTotal > 0 ? [{ label: range.period === "mes" ? "Pendiente (incluye fijos)" : "Pendiente", value: -pendingTotal }] : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-1.5">
                <dt className="text-muted">{row.label}</dt>
                <dd className={`tabular-nums ${row.className ?? ""}`}>{formatMoney(row.value)}</dd>
              </div>
            ))}
            <div className="flex justify-between py-2">
              <dt className="font-semibold">{pendingTotal > 0 ? "Libre tras pendientes" : "Queda libre"}</dt>
              <dd className={`font-semibold tabular-nums ${freeAfterPending < 0 ? "text-danger" : ""}`}>{formatMoney(freeAfterPending)}</dd>
            </div>
          </dl>
        ) : (
          <>
            {tab === "gastos" ? (
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <Donut slices={chart.rows} total={chart.total} size="sm" caption="gastos" />
                <div className="min-w-0 space-y-3">
                  <Gauge
                    size="xs"
                    pct={spentPct}
                    color={spentPct !== null && spentPct > 100 ? "var(--danger)" : "#f2444f"}
                    label="Del sueldo gastado"
                    detail={incomes.total > 0 ? `de ${formatMoney(incomes.total)}` : "Sin ingresos cargados"}
                  />
                  <Gauge
                    size="xs"
                    pct={savingPct}
                    color="#2ea89a"
                    label="Oportunidad de ahorro"
                    detail={incomes.total > 0 ? (leftover > 0 ? `sobran ${formatMoney(leftover)}` : "no sobró nada") : undefined}
                  />
                </div>
              </div>
            ) : (
              <Donut slices={chart.rows} total={chart.total} />
            )}
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

      <details id="listado" className="card group scroll-mt-4" open={openList}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="font-semibold">Listado</span>
          <span className="flex items-center gap-2 text-sm">
            <span className="text-muted">{transactions.length} {transactions.length === 1 ? "movimiento" : "movimientos"}</span>
            <span className="text-accent group-open:hidden">Mostrar</span>
            <span className="hidden text-accent group-open:inline">Ocultar</span>
          </span>
        </summary>
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-3 gap-1 text-sm" role="group" aria-label="Estado">
            {STATUS_FILTERS.map((f) => (
              <Link
                key={f.value}
                href={link({ estado: f.value === "todos" ? null : f.value })}
                aria-current={status === f.value ? "true" : undefined}
                className={`rounded-lg border px-2 py-1.5 text-center ${status === f.value ? "border-accent bg-accent-soft font-semibold" : "border-border text-muted"}`}
              >
                <span className="block">{f.label}</span>
                <span className="block text-xs tabular-nums">{statusCount[f.value]}</span>
              </Link>
            ))}
          </div>
          {transactions.length === 0 && (
            <p className="text-center text-sm text-muted">
              {status === "pendiente" ? "No hay movimientos pendientes." : status === "pagado" ? "No hay movimientos abonados." : "No hay movimientos."}
            </p>
          )}

          {[...byDate.entries()].map(([date, items]) => (
            <section key={date} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted">{formatDay(date)}</h2>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {items.map((t) => {
                  const c = t.category_id ? category.get(t.category_id) : undefined;
                  const sign = t.type === "ingreso" ? "+" : t.type === "egreso" ? "−" : "";
                  const split = t.type === "egreso" && !t.for_member ? sharesLabel(t.shares, ctx.members) : "";
                  return (
                    <li key={t.id}>
                      <Link href={`/movimientos/${t.id}`} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-2xl" aria-hidden>{t.project_id ? "🎯" : (c?.emoji ?? (t.type === "transferencia" ? "🐷" : "📦"))}</span>
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
      </details>

      <details id="fijos" className="card group scroll-mt-4" open={showFixed}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block font-semibold">Fijos</span>
            <span className="block text-xs text-muted">{monthLabel(fixedMonth)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-sm">
            <span className="tabular-nums text-muted">
              {fixedInfo.count === 0
                ? "Sin fijos"
                : fixedInfo.pending === 0
                  ? "Todo pagado 🎉"
                  : `Faltan ${fixedInfo.pending} · ${formatMoney(fixedInfo.total)}`}
            </span>
            <span className="text-accent group-open:hidden">Mostrar</span>
            <span className="hidden text-accent group-open:inline">Ocultar</span>
          </span>
        </summary>
        <div className="mt-3 space-y-3">
          <Link href="/fijos/nuevo" className="btn-ghost w-full py-2 text-sm">+ Agregar fijo</Link>
          <FixedList ctx={ctx} month={fixedMonth} fixed={fixed} transactions={fixedMonthTx} />
        </div>
      </details>
    </div>
  );
}

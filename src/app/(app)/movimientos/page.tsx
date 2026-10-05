import Link from "next/link";
import { getContext } from "@/lib/data";
import { currentMonth, formatDay, formatMoney, isMonth } from "@/lib/format";
import { getMonthTransactions } from "@/lib/queries";
import { MonthPicker } from "@/components/month-picker";

export default async function TransactionsPage({ searchParams }: PageProps<"/movimientos">) {
  const params = await searchParams;
  const month = isMonth(params.mes) ? params.mes : currentMonth();
  const categoryFilter = typeof params.cat === "string" ? params.cat : "";
  const memberFilter = typeof params.quien === "string" ? params.quien : "";

  const ctx = await getContext();
  const all = await getMonthTransactions(ctx, month);
  const transactions = all.filter(
    (t) => (!categoryFilter || t.category_id === categoryFilter) && (!memberFilter || t.paid_by === memberFilter),
  );
  const category = new Map(ctx.categories.map((c) => [c.id, c]));
  const member = new Map(ctx.members.map((m) => [m.id, m]));

  const byDate = new Map<string, typeof transactions>();
  for (const t of transactions) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Movimientos</h1>
      <MonthPicker month={month} basePath="/movimientos" />

      <form className="grid grid-cols-2 gap-2">
        <input type="hidden" name="mes" value={month} />
        <select name="cat" defaultValue={categoryFilter} className="input">
          <option value="">Todas las categorías</option>
          {ctx.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
          ))}
        </select>
        <select name="quien" defaultValue={memberFilter} className="input">
          <option value="">Pagó cualquiera</option>
          {ctx.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button className="btn-ghost col-span-2 py-1.5 text-sm">Filtrar</button>
      </form>

      {transactions.length === 0 && <p className="card text-center text-muted">No hay movimientos.</p>}

      {[...byDate.entries()].map(([date, items]) => (
        <section key={date} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted">{formatDay(date)}</h2>
          <ul className="card divide-y divide-border p-0">
            {items.map((t) => {
              const c = t.category_id ? category.get(t.category_id) : undefined;
              const sign = t.type === "ingreso" ? "+" : t.type === "egreso" ? "−" : "";
              return (
                <li key={t.id}>
                  <Link href={`/movimientos/${t.id}`} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl" aria-hidden>{c?.emoji ?? (t.type === "transferencia" ? "🔁" : "📦")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t.description || c?.name || "Sin descripción"}</span>
                      <span className="block text-xs text-muted">
                        {t.paid_by ? member.get(t.paid_by)?.name : "—"} ·{" "}
                        {t.for_member ? `para ${member.get(t.for_member)?.name}` : "compartido"}
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

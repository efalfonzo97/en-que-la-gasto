import Link from "next/link";
import { getContext } from "@/lib/data";
import { currentMonth, formatDay, formatMoney, isMonth, today } from "@/lib/format";
import { fixedStatus, getFixedExpenses, getMonthTransactions } from "@/lib/queries";
import { MonthPicker } from "@/components/month-picker";
import { sharesLabel } from "@/lib/split";
import { payFixed, unpayFixed } from "../actions";

export default async function FixedPage({ searchParams }: PageProps<"/fijos">) {
  const params = await searchParams;
  const month = isMonth(params.mes) ? params.mes : currentMonth();
  const ctx = await getContext();
  const [fixed, transactions] = await Promise.all([getFixedExpenses(ctx), getMonthTransactions(ctx, month)]);
  const rows = fixedStatus(fixed, transactions);
  const category = new Map(ctx.categories.map((c) => [c.id, c]));
  const member = new Map(ctx.members.map((m) => [m.id, m]));
  const pending = rows.filter((r) => !r.payment);
  const pendingTotal = pending.reduce((sum, r) => sum + r.fixed.amount, 0);
  const payDate = month === currentMonth() ? today() : `${month}-01`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fijos del mes</h1>
        <Link href="/fijos/nuevo" className="btn-ghost px-3 py-1.5 text-sm">+ Agregar</Link>
      </div>
      <MonthPicker month={month} basePath="/fijos" />
      <p className="text-sm text-muted">
        {pending.length === 0
          ? "Todo pagado este mes. 🎉"
          : `Faltan ${pending.length} de ${rows.length}, unos ${formatMoney(pendingTotal)}.`}
      </p>

      {rows.length === 0 && (
        <p className="card text-center text-muted">
          Todavía no cargaste gastos fijos. Agregalos acá o importá tu Excel desde Ajustes.
        </p>
      )}

      <ul className="space-y-2">
        {rows.map(({ fixed: f, payment }) => {
          const c = f.category_id ? category.get(f.category_id) : undefined;
          return (
            <li key={f.id} className={`card space-y-3 ${payment ? "opacity-70" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>{c?.emoji ?? "📅"}</span>
                <Link href={`/fijos/${f.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{f.description}</span>
                  <span className="block text-xs text-muted">
                    {f.due_day ? `Vence el ${f.due_day}` : "Sin vencimiento"} ·{" "}
                    {f.paid_by ? `paga ${member.get(f.paid_by)?.name}` : "paga cualquiera"} ·{" "}
                    {f.for_member ? `para ${member.get(f.for_member)?.name}` : `compartido${f.shares ? ` ${sharesLabel(f.shares, ctx.members)}` : ""}`}
                  </span>
                </Link>
                {payment && <span className="text-sm font-semibold text-income">✓ Pagado</span>}
              </div>

              {payment ? (
                <form action={unpayFixed} className="flex items-center justify-between text-sm text-muted">
                  <input type="hidden" name="transaction_id" value={payment.id} />
                  <span>
                    {formatMoney(payment.amount)} el {formatDay(payment.date)}
                    {payment.paid_by && ` por ${member.get(payment.paid_by)?.name}`}
                  </span>
                  <button className="underline">Deshacer</button>
                </form>
              ) : (
                <form action={payFixed} className="flex gap-2">
                  <input type="hidden" name="fixed_id" value={f.id} />
                  <input type="hidden" name="date" value={payDate} />
                  <input
                    className="input flex-1 py-2"
                    name="amount"
                    inputMode="decimal"
                    aria-label={`Importe pagado de ${f.description}`}
                    defaultValue={f.amount ? String(f.amount).replace(".", ",") : ""}
                    placeholder="Importe"
                  />
                  <select name="paid_by" className="input w-28 py-2" defaultValue={f.paid_by ?? ctx.me.id} aria-label="Quién pagó">
                    {ctx.members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button className="btn py-2">Pagado</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

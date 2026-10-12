import Link from "next/link";
import type { AppContext } from "@/lib/data";
import { currentMonth, formatDay, formatMoney, today } from "@/lib/format";
import { fixedStatus } from "@/lib/queries";
import { sharesLabel } from "@/lib/split";
import type { FixedExpense, Transaction } from "@/lib/types";
import { payFixed, unpayFixed } from "@/app/(app)/actions";

type Props = { ctx: AppContext; month: string; fixed: FixedExpense[]; transactions: Transaction[] };

/** Fijos del mes con su estado: pagado o con el formulario para marcarlo. */
export function FixedList({ ctx, month, fixed, transactions }: Props) {
  const rows = fixedStatus(fixed, transactions);
  const category = new Map(ctx.categories.map((c) => [c.id, c]));
  const member = new Map(ctx.members.map((m) => [m.id, m]));
  const payDate = month === currentMonth() ? today() : `${month}-01`;

  if (rows.length === 0) {
    return (
      <p className="text-center text-sm text-muted">
        Todavía no cargaste gastos fijos. Agregalos acá o importá tu Excel desde Ajustes.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
        {rows.map(({ fixed: f, payment }) => {
          const c = f.category_id ? category.get(f.category_id) : undefined;
          return (
            <li key={f.id} className={`space-y-3 rounded-xl border border-border p-3 ${payment ? "opacity-70" : ""}`}>
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
                <form action={payFixed} className="grid grid-cols-2 gap-2">
                  <input type="hidden" name="fixed_id" value={f.id} />
                  <input type="hidden" name="date" value={payDate} />
                  <input
                    className="input min-w-0 py-2"
                    name="amount"
                    inputMode="decimal"
                    aria-label={`Importe pagado de ${f.description}`}
                    defaultValue={f.amount ? String(f.amount).replace(".", ",") : ""}
                    placeholder="Importe"
                  />
                  <select name="paid_by" className="input min-w-0 py-2" defaultValue={f.paid_by ?? ctx.me.id} aria-label="Quién pagó">
                    {ctx.members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button className="btn col-span-2 py-2">Marcar como pagado</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
  );
}

export function fixedPendingInfo(fixed: FixedExpense[], transactions: Transaction[]) {
  const rows = fixedStatus(fixed, transactions);
  const pending = rows.filter((r) => !r.payment);
  return { count: rows.length, pending: pending.length, total: pending.reduce((s, r) => s + r.fixed.amount, 0) };
}

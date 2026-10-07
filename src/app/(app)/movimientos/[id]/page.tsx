import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { formatMoney, today } from "@/lib/format";
import { getTransaction } from "@/lib/queries";
import { formatPct, splitAmounts } from "@/lib/split";
import { TransactionForm } from "@/components/transaction-form";
import { deleteTransaction } from "../../actions";

export default async function EditTransactionPage({ params }: PageProps<"/movimientos/[id]">) {
  const { id } = await params;
  const ctx = await getContext();
  const tx = await getTransaction(ctx, id);
  if (!tx) notFound();

  const shared = tx.type === "egreso" && !tx.for_member && ctx.members.length > 1;
  const parts = shared ? splitAmounts(tx, ctx.members) : [];
  const payer = ctx.members.find((m) => m.id === tx.paid_by);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editar movimiento</h1>

      {shared && (
        <section className="card space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Cuánto le toca a cada uno</h2>
            <span className="text-sm text-muted tabular-nums">{formatMoney(tx.amount, tx.currency)}</span>
          </div>
          <ul className="space-y-1 text-sm">
            {parts.map((p) => (
              <li key={p.member.id} className="flex justify-between">
                <span>
                  <span className="font-medium">{p.member.name}</span> <span className="text-muted">({formatPct(p.pct)}%)</span>
                </span>
                <span className="tabular-nums">{formatMoney(p.amount, tx.currency)}</span>
              </li>
            ))}
          </ul>
          {payer && (
            <p className="border-t border-border pt-2 text-sm text-muted">
              Pagó {payer.name}.{" "}
              {parts
                .filter((p) => p.member.id !== payer.id && p.amount > 0)
                .map((p) => `${formatMoney(p.amount, tx.currency)} de ${p.member.name} quedan a favor de ${payer.name}.`)
                .join(" ")}
            </p>
          )}
        </section>
      )}

      <TransactionForm
        members={ctx.members}
        categories={ctx.categories}
        accounts={ctx.accounts}
        meId={ctx.me.id}
        today={today()}
        transaction={tx}
      />
      <form action={deleteTransaction}>
        <input type="hidden" name="id" value={tx.id} />
        <button className="btn-ghost w-full text-danger">Borrar movimiento</button>
      </form>
    </div>
  );
}

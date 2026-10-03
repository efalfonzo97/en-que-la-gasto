import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { today } from "@/lib/format";
import { getTransaction } from "@/lib/queries";
import { TransactionForm } from "@/components/transaction-form";
import { deleteTransaction } from "../../actions";

export default async function EditTransactionPage({ params }: PageProps<"/movimientos/[id]">) {
  const { id } = await params;
  const ctx = await getContext();
  const tx = await getTransaction(ctx, id);
  if (!tx) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editar movimiento</h1>
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

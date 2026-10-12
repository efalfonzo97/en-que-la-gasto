import { getContext } from "@/lib/data";
import { today } from "@/lib/format";
import { getFixedExpenses } from "@/lib/queries";
import { TransactionForm } from "@/components/transaction-form";

export default async function NewTransactionPage() {
  const ctx = await getContext();
  const fixed = await getFixedExpenses(ctx);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cargar movimiento</h1>
      <TransactionForm
        members={ctx.members}
        categories={ctx.categories}
        accounts={ctx.accounts}
        meId={ctx.me.id}
        today={today()}
        fixed={fixed}
      />
    </div>
  );
}

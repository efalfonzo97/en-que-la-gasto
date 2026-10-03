import { getContext } from "@/lib/data";
import { today } from "@/lib/format";
import { TransactionForm } from "@/components/transaction-form";

export default async function NewTransactionPage() {
  const { me, members, categories, accounts } = await getContext();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cargar movimiento</h1>
      <TransactionForm members={members} categories={categories} accounts={accounts} meId={me.id} today={today()} />
    </div>
  );
}

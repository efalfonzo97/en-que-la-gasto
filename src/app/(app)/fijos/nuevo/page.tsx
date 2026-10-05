import { getContext } from "@/lib/data";
import { FixedForm } from "@/components/fixed-form";

export default async function NewFixedPage() {
  const { members, categories, accounts } = await getContext();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nuevo gasto fijo</h1>
      <FixedForm members={members} categories={categories} accounts={accounts} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { getFixedExpenses } from "@/lib/queries";
import { FixedForm } from "@/components/fixed-form";
import { deactivateFixed } from "../../actions";

export default async function EditFixedPage({ params }: PageProps<"/fijos/[id]">) {
  const { id } = await params;
  const ctx = await getContext();
  const fixed = (await getFixedExpenses(ctx)).find((f) => f.id === id);
  if (!fixed) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editar gasto fijo</h1>
      <FixedForm members={ctx.members} categories={ctx.categories} accounts={ctx.accounts} fixed={fixed} />
      <form action={deactivateFixed}>
        <input type="hidden" name="id" value={fixed.id} />
        <button className="btn-ghost w-full text-danger">Dejar de usar este fijo</button>
      </form>
    </div>
  );
}

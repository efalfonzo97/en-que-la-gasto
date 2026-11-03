"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { parseAmount } from "@/lib/import";

export type BudgetFormState = { error?: string };

/** Guarda el tope de cada categoría de gasto. Vacío o 0 = sin presupuesto. */
export async function saveBudgets(_: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
  const { supabase, me, categories } = await getContext();
  const toSave: { category_id: string; household_id: string; amount: number }[] = [];
  const toDelete: string[] = [];

  for (const c of categories.filter((c) => c.kind === "egreso")) {
    const raw = formData.get(`budget_${c.id}`);
    if (typeof raw !== "string") continue;
    const amount = raw.trim() ? parseAmount(raw.trim()) : 0;
    if (amount === null || amount < 0) return { error: `El presupuesto de ${c.name} no es un importe válido.` };
    if (amount > 0) toSave.push({ category_id: c.id, household_id: me.household_id, amount });
    else toDelete.push(c.id);
  }

  if (toSave.length) {
    const { error } = await supabase.from("category_budgets").upsert(toSave, { onConflict: "category_id" });
    if (error) return { error: error.message };
  }
  if (toDelete.length) {
    const { error } = await supabase.from("category_budgets").delete().in("category_id", toDelete);
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/presupuestos?guardado=1");
}

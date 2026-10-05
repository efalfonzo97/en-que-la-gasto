"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/data";
import { normalize, type ImportResult } from "@/lib/import";

export type ImportState = { error?: string; done?: string };

export async function importRows(data: ImportResult): Promise<ImportState> {
  const { supabase, me, members, categories, accounts } = await getContext();

  const memberId = (name: string | null) =>
    name ? (members.find((m) => normalize(m.name) === normalize(name))?.id ?? null) : null;
  const categoryId = (name: string) => categories.find((c) => c.name === name)?.id ?? null;

  // Crea los medios de pago que todavía no existen.
  const accountIds = new Map(accounts.map((a) => [normalize(a.name), a.id]));
  const missing = [
    ...new Set(
      [...data.transactions, ...data.fixed]
        .map((r) => r.account)
        .filter((a): a is string => !!a && !accountIds.has(normalize(a))),
    ),
  ];
  if (missing.length) {
    const { data: created, error } = await supabase
      .from("accounts")
      .insert(missing.map((name) => ({ household_id: me.household_id, name })))
      .select("id, name");
    if (error) return { error: error.message };
    for (const a of created ?? []) accountIds.set(normalize(a.name), a.id);
  }
  const accountId = (name: string | null) => (name ? (accountIds.get(normalize(name)) ?? null) : null);

  if (data.fixed.length) {
    const { error } = await supabase.from("fixed_expenses").insert(
      data.fixed.map((f) => ({
        household_id: me.household_id,
        description: f.description,
        amount: f.amount,
        category_id: categoryId(f.category),
        paid_by: memberId(f.paidBy),
        for_member: memberId(f.forMember),
        account_id: accountId(f.account),
      })),
    );
    if (error) return { error: error.message };
  }

  if (data.transactions.length) {
    const { error } = await supabase.from("transactions").insert(
      data.transactions.map((t) => ({
        household_id: me.household_id,
        date: t.date,
        type: t.type,
        status: t.status,
        amount: t.amount,
        description: t.description,
        category_id: categoryId(t.category),
        paid_by: memberId(t.paidBy),
        for_member: memberId(t.forMember),
        account_id: accountId(t.account),
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { done: `Listo: ${data.transactions.length} movimientos y ${data.fixed.length} gastos fijos importados.` };
}

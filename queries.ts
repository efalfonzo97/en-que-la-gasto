import type { AppContext } from "@/lib/data";
import { monthRange } from "@/lib/format";
import type { FixedExpense, Transaction } from "@/lib/types";

const TX_FIELDS =
  "id, date, type, status, paid_by, for_member, category_id, description, amount, currency, account_id, fixed_expense_id, note, shares";

export async function getMonthTransactions(ctx: AppContext, month: string) {
  const { start, next } = monthRange(month);
  return getRangeTransactions(ctx, start, next);
}

/** Movimientos entre start (inclusive) y end (exclusiva). */
export async function getRangeTransactions(ctx: AppContext, start: string, next: string) {
  const { data } = await ctx.supabase
    .from("transactions")
    .select(TX_FIELDS)
    .eq("household_id", ctx.me.household_id)
    .gte("date", start)
    .lt("date", next)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  return ((data ?? []) as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }));
}

export async function getTransaction(ctx: AppContext, id: string) {
  const { data } = await ctx.supabase.from("transactions").select(TX_FIELDS).eq("id", id).maybeSingle<Transaction>();
  return data ? { ...data, amount: Number(data.amount) } : null;
}

export async function getFixedExpenses(ctx: AppContext) {
  const { data } = await ctx.supabase
    .from("fixed_expenses")
    .select("id, description, category_id, amount, due_day, paid_by, for_member, account_id, active, shares")
    .eq("household_id", ctx.me.household_id)
    .eq("active", true)
    .order("due_day", { nullsFirst: false })
    .order("description");
  return ((data ?? []) as FixedExpense[]).map((f) => ({ ...f, amount: Number(f.amount) }));
}

/** Estado de cada fijo en el mes: el movimiento que lo pagó, si existe. */
export function fixedStatus(fixed: FixedExpense[], transactions: Transaction[]) {
  return fixed.map((f) => ({
    fixed: f,
    payment: transactions.find((t) => t.fixed_expense_id === f.id) ?? null,
  }));
}

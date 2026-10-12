import type { AppContext } from "@/lib/data";
import { monthRange } from "@/lib/format";
import type { FixedExpense, Project, Transaction } from "@/lib/types";

const TX_FIELDS =
  "id, date, type, status, paid_by, for_member, category_id, description, amount, currency, account_id, fixed_expense_id, note, shares, project_id, project_amount";

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
  return ((data ?? []) as Transaction[]).map(normalizeTx);
}

function normalizeTx(t: Transaction): Transaction {
  return { ...t, amount: Number(t.amount), project_amount: t.project_amount == null ? null : Number(t.project_amount) };
}

export async function getTransaction(ctx: AppContext, id: string) {
  const { data } = await ctx.supabase.from("transactions").select(TX_FIELDS).eq("id", id).maybeSingle<Transaction>();
  return data ? normalizeTx(data) : null;
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

/** Texto comparable: sin mayúsculas, acentos ni espacios de más. */
function normalizeText(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Estado de cada fijo en el mes: el movimiento que lo pagó, si existe.
 * Primero busca los pagados con el botón "Pagado" (vinculados al fijo). Si no hay,
 * toma un gasto del mes con la misma descripción, para que un fijo cargado desde
 * "Cargar" no quede también como pendiente. Cada movimiento cubre un solo fijo.
 */
export function fixedStatus(fixed: FixedExpense[], transactions: Transaction[]) {
  const used = new Set<string>();
  const linked = fixed.map((f) => {
    const payment = transactions.find((t) => t.fixed_expense_id === f.id) ?? null;
    if (payment) used.add(payment.id);
    return { fixed: f, payment };
  });
  return linked.map((row) => {
    if (row.payment) return row;
    const name = normalizeText(row.fixed.description);
    const match = transactions.find(
      (t) =>
        !used.has(t.id) &&
        !t.fixed_expense_id &&
        t.type === "egreso" &&
        t.status === "pagado" &&
        normalizeText(t.description) === name,
    );
    if (match) used.add(match.id);
    return { fixed: row.fixed, payment: match ?? null };
  });
}

const PROJECT_FIELDS = "id, title, description, target_amount, currency, for_member, archived, created_at";

export async function getProjects(ctx: AppContext) {
  const { data } = await ctx.supabase
    .from("projects")
    .select(PROJECT_FIELDS)
    .eq("household_id", ctx.me.household_id)
    .order("archived")
    .order("created_at", { ascending: false });
  return ((data ?? []) as Project[]).map((p) => ({ ...p, target_amount: Number(p.target_amount) }));
}

export async function getProject(ctx: AppContext, id: string) {
  const { data } = await ctx.supabase.from("projects").select(PROJECT_FIELDS).eq("id", id).maybeSingle<Project>();
  return data ? { ...data, target_amount: Number(data.target_amount) } : null;
}

/** Aportes (movimientos) de uno o varios proyectos, del más nuevo al más viejo. */
export async function getContributions(ctx: AppContext, projectIds?: string[]) {
  let query = ctx.supabase
    .from("transactions")
    .select(TX_FIELDS)
    .eq("household_id", ctx.me.household_id)
    .not("project_id", "is", null);
  if (projectIds) query = query.in("project_id", projectIds);
  const { data } = await query.order("date", { ascending: false }).order("created_at", { ascending: false });
  return ((data ?? []) as Transaction[]).map(normalizeTx);
}

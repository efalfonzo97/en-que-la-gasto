import type { Category, FixedExpense, Member, Transaction } from "@/lib/types";
import { resolveShares } from "@/lib/split";
import { isMine, isMyFixed } from "@/lib/view";

type FixedRow = { fixed: FixedExpense; payment: Transaction | null };

const sum = (list: Transaction[]) => list.reduce((s, t) => s + t.amount, 0);

/**
 * Resumen del mes. Con memberId muestra solo lo de esa persona:
 * lo que cobró o pagó, lo que es para ella y lo que le falta pagar.
 */
export function monthSummary(
  transactions: Transaction[],
  fixedRows: FixedRow[],
  members: Member[],
  categories: Category[],
  memberId: string | null = null,
) {
  const allArs = transactions.filter((t) => t.currency === "ARS");
  const ars = memberId ? allArs.filter((t) => isMine(t, memberId)) : allArs;
  const paid = ars.filter((t) => t.status === "pagado");

  const income = sum(paid.filter((t) => t.type === "ingreso"));
  const spent = sum(paid.filter((t) => t.type === "egreso"));
  const saved = sum(paid.filter((t) => t.type === "transferencia"));
  const pendingTx = ars.filter((t) => t.type === "egreso" && t.status === "pendiente");
  const pendingFixed = fixedRows.filter((r) => !r.payment && (!memberId || isMyFixed(r.fixed, memberId)));
  const pending = sum(pendingTx) + pendingFixed.reduce((s, r) => s + r.fixed.amount, 0);

  // Gastos compartidos del hogar: cuánto puso cada uno y cuánto le corresponde según el reparto.
  const sharedSpent = allArs.filter((t) => t.status === "pagado" && t.type === "egreso" && !t.for_member);
  const perMember = members.map((m) => {
    const contributed = sum(sharedSpent.filter((t) => t.paid_by === m.id));
    const share = sharedSpent.reduce((s, t) => s + (t.amount * (resolveShares(t, members)[m.id] ?? 0)) / 100, 0);
    const monthIncome = sum(
      allArs.filter((t) => t.status === "pagado" && t.type === "ingreso" && t.paid_by === m.id),
    );
    return {
      member: m,
      contributed,
      share,
      balance: contributed - share,
      personal: sum(allArs.filter((t) => t.status === "pagado" && t.type === "egreso" && t.for_member === m.id)),
      income: monthIncome || Number(m.monthly_income) || 0,
    };
  });
  const sharedTotal = sum(sharedSpent);

  const byCategory = categories
    .filter((c) => c.kind === "egreso")
    .map((c) => ({ category: c, total: sum(paid.filter((t) => t.type === "egreso" && t.category_id === c.id)) }))
    .filter((r) => r.total > 0);
  const uncategorized = sum(paid.filter((t) => t.type === "egreso" && !t.category_id));
  byCategory.sort((a, b) => b.total - a.total);

  const essential = byCategory.filter((r) => r.category.essential).reduce((s, r) => s + r.total, 0);

  const upcoming = [
    ...pendingFixed.map((r) => ({ id: r.fixed.id, description: r.fixed.description, amount: r.fixed.amount, day: r.fixed.due_day, href: "/fijos" })),
    ...pendingTx.map((t) => ({ id: t.id, description: t.description, amount: t.amount, day: Number(t.date.slice(8)), href: `/movimientos/${t.id}` })),
  ].sort((a, b) => (a.day ?? 99) - (b.day ?? 99));

  return {
    income,
    spent,
    saved,
    pending,
    available: income - spent - saved - pending,
    perMember,
    sharedTotal,
    byCategory,
    uncategorized,
    essential,
    upcoming,
    hasUsd: transactions.some((t) => t.currency === "USD"),
  };
}

/** Totales por categoría de un tipo (para el gráfico de torta). */
export function categoryBreakdown(transactions: Transaction[], categories: Category[], kind: "egreso" | "ingreso") {
  const list = transactions.filter((t) => t.currency === "ARS" && t.status === "pagado" && t.type === kind);
  const total = sum(list);
  const rows = categories
    .filter((c) => c.kind === kind)
    .map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, total: sum(list.filter((t) => t.category_id === c.id)) }))
    .filter((r) => r.total > 0);
  const other = sum(list.filter((t) => !t.category_id || !categories.some((c) => c.id === t.category_id && c.kind === kind)));
  if (other > 0) rows.push({ id: "sin", name: "Sin categoría", emoji: "📦", total: other });
  rows.sort((a, b) => b.total - a.total);
  return { total, rows };
}

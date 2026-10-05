import type { Category, FixedExpense, Member, Transaction } from "@/lib/types";

type FixedRow = { fixed: FixedExpense; payment: Transaction | null };

export function monthSummary(
  transactions: Transaction[],
  fixedRows: FixedRow[],
  members: Member[],
  categories: Category[],
) {
  const ars = transactions.filter((t) => t.currency === "ARS");
  const sum = (list: Transaction[]) => list.reduce((s, t) => s + t.amount, 0);
  const paid = ars.filter((t) => t.status === "pagado");

  const income = sum(paid.filter((t) => t.type === "ingreso"));
  const spent = sum(paid.filter((t) => t.type === "egreso"));
  const saved = sum(paid.filter((t) => t.type === "transferencia"));
  const pendingTx = ars.filter((t) => t.type === "egreso" && t.status === "pendiente");
  const pendingFixed = fixedRows.filter((r) => !r.payment);
  const pending = sum(pendingTx) + pendingFixed.reduce((s, r) => s + r.fixed.amount, 0);

  // Lo que cada uno puso en gastos compartidos, y su ingreso del mes.
  const sharedSpent = paid.filter((t) => t.type === "egreso" && !t.for_member);
  const perMember = members.map((m) => {
    const monthIncome = sum(paid.filter((t) => t.type === "ingreso" && t.paid_by === m.id));
    return {
      member: m,
      shared: sum(sharedSpent.filter((t) => t.paid_by === m.id)),
      personal: sum(paid.filter((t) => t.type === "egreso" && t.for_member === m.id)),
      income: monthIncome || Number(m.monthly_income) || 0,
    };
  });
  const sharedTotal = sum(sharedSpent);
  const sorted = [...perMember].sort((a, b) => b.shared - a.shared);
  const difference = sorted.length >= 2 ? sorted[0].shared - sorted[1].shared : 0;

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
    leader: difference > 0 ? sorted[0].member : null,
    difference,
    byCategory,
    uncategorized,
    essential,
    upcoming,
    hasUsd: transactions.some((t) => t.currency === "USD"),
  };
}

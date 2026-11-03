import type { Budget, Category, Transaction } from "@/lib/types";

/** Desde qué porcentaje del presupuesto se avisa. */
export const BUDGET_WARNING_PCT = 80;

export type BudgetLevel = "ok" | "alerta" | "pasado";

export type BudgetRow = {
  category: Category;
  budget: number;
  /** Lo gastado (pagado) en el mes, en pesos, de todo el hogar. */
  spent: number;
  pct: number;
  level: BudgetLevel;
};

export function budgetLevel(pct: number): BudgetLevel {
  if (pct > 100) return "pasado";
  if (pct >= BUDGET_WARNING_PCT) return "alerta";
  return "ok";
}

/**
 * Cómo viene cada categoría con presupuesto en el mes. Cuenta los gastos
 * pagados en pesos de todo el hogar, sin importar la vista elegida, porque
 * el presupuesto es del hogar. Ordena primero las que están más cerca del tope.
 */
export function budgetRows(budgets: Budget[], categories: Category[], monthTransactions: Transaction[]): BudgetRow[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return budgets
    .map((b) => {
      const category = byId.get(b.category_id);
      if (!category || category.archived || category.kind !== "egreso") return null;
      const spent = monthTransactions
        .filter((t) => t.currency === "ARS" && t.status === "pagado" && t.type === "egreso" && t.category_id === b.category_id)
        .reduce((s, t) => s + t.amount, 0);
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return { category, budget: b.amount, spent, pct, level: budgetLevel(pct) };
    })
    .filter((r): r is BudgetRow => r !== null)
    .sort((a, b) => b.pct - a.pct);
}

export const BUDGET_COLORS: Record<BudgetLevel, string> = {
  ok: "#2ea89a",
  alerta: "#f5a524",
  pasado: "#f2444f",
};

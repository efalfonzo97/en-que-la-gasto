"use client";

import { useActionState } from "react";
import { saveBudgets, type BudgetFormState } from "@/app/(app)/presupuestos/actions";
import { formatMoney } from "@/lib/format";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  budgets: Record<string, number>;
  /** Promedio mensual gastado en cada categoría, como referencia. */
  averages: Record<string, number>;
};

export function BudgetForm({ categories, budgets, averages }: Props) {
  const [state, action, pending] = useActionState<BudgetFormState, FormData>(saveBudgets, {});
  return (
    <form action={action} className="space-y-3">
      <ul className="space-y-3">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-3">
            <label htmlFor={`budget_${c.id}`} className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {c.emoji} {c.name}
              </span>
              <span className="block text-xs text-muted">
                {averages[c.id] ? `Promedio: ${formatMoney(averages[c.id])}/mes` : "Sin gastos recientes"}
              </span>
            </label>
            <input
              className="input w-36 text-right tabular-nums"
              id={`budget_${c.id}`}
              name={`budget_${c.id}`}
              inputMode="decimal"
              placeholder="Sin tope"
              defaultValue={budgets[c.id] ? String(budgets[c.id]).replace(".", ",") : ""}
            />
          </li>
        ))}
      </ul>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>
        Guardar presupuestos
      </button>
    </form>
  );
}

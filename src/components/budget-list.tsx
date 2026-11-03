import { formatMoney } from "@/lib/format";
import { BUDGET_COLORS, type BudgetRow } from "@/lib/budgets";

/** Barras de lo gastado contra el tope de cada categoría. */
export function BudgetList({ rows }: { rows: BudgetRow[] }) {
  return (
    <ul className="space-y-3 text-sm">
      {rows.map((r) => (
        <li key={r.category.id} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate font-medium">
              {r.category.emoji} {r.category.name}
              {r.level === "pasado" && <span className="ml-1 text-danger">· te pasaste</span>}
              {r.level === "alerta" && <span className="ml-1 text-[#b7791f] dark:text-[#f5a524]">· cerca del tope</span>}
            </span>
            <span className="shrink-0 tabular-nums text-muted">{Math.round(r.pct)}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(r.pct, 100))}
            aria-label={`${r.category.name}: ${Math.round(r.pct)}% del presupuesto`}
          >
            <div className="h-full rounded-full" style={{ width: `${Math.min(r.pct, 100)}%`, background: BUDGET_COLORS[r.level] }} />
          </div>
          <p className="tabular-nums text-xs text-muted">
            {formatMoney(r.spent)} de {formatMoney(r.budget)}
            {r.spent < r.budget ? ` · quedan ${formatMoney(r.budget - r.spent)}` : ` · ${formatMoney(r.spent - r.budget)} de más`}
          </p>
        </li>
      ))}
    </ul>
  );
}

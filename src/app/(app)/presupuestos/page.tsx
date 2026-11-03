import Link from "next/link";
import { getContext } from "@/lib/data";
import { currentMonth, monthLabel, monthRange, shiftMonth } from "@/lib/format";
import { BUDGET_WARNING_PCT, budgetRows } from "@/lib/budgets";
import { ESSENTIAL_LOOKBACK_MONTHS } from "@/lib/emergency";
import { getBudgets, getMonthTransactions, getRangeTransactions } from "@/lib/queries";
import { BudgetForm } from "@/components/budget-form";
import { BudgetList } from "@/components/budget-list";

export default async function BudgetsPage({ searchParams }: PageProps<"/presupuestos">) {
  const params = await searchParams;
  const ctx = await getContext();
  const month = currentMonth();
  const [{ ready, budgets }, monthTx, past] = await Promise.all([
    getBudgets(ctx),
    getMonthTransactions(ctx, month),
    getRangeTransactions(ctx, monthRange(shiftMonth(month, -ESSENTIAL_LOOKBACK_MONTHS)).start, monthRange(month).start),
  ]);
  const categories = ctx.categories.filter((c) => c.kind === "egreso" && !c.archived);
  const rows = budgetRows(budgets, ctx.categories, monthTx);

  // Promedio mensual de cada categoría en los últimos meses con gastos, como referencia.
  const paidPast = past.filter((t) => t.currency === "ARS" && t.status === "pagado" && t.type === "egreso");
  const monthsWithData = new Set(paidPast.map((t) => t.date.slice(0, 7))).size;
  const averages = Object.fromEntries(
    categories.map((c) => [
      c.id,
      monthsWithData ? Math.round(paidPast.filter((t) => t.category_id === c.id).reduce((s, t) => s + t.amount, 0) / monthsWithData) : 0,
    ]),
  );

  return (
    <div className="space-y-4">
      <div>
        <Link href="/" className="text-sm text-accent">‹ Inicio</Link>
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <p className="text-sm text-muted">
          Un tope mensual por categoría para todo el hogar. En el inicio vas a ver cuánto queda y un aviso al llegar al{" "}
          {BUDGET_WARNING_PCT}%.
        </p>
      </div>
      {params.guardado && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm">Presupuestos guardados ✓</p>}

      {!ready ? (
        <p className="card text-sm">
          Falta un paso en Supabase: correr <code>supabase/migrations/0005_presupuestos_emergencia.sql</code> (está en el README).
        </p>
      ) : (
        <>
          {rows.length > 0 && (
            <section className="card space-y-3">
              <h2 className="font-semibold">{monthLabel(month)}</h2>
              <BudgetList rows={rows} />
            </section>
          )}
          <section className="card space-y-3">
            <h2 className="font-semibold">Topes por categoría</h2>
            <p className="text-xs text-muted">Dejá vacío para no ponerle tope. El promedio es de los últimos meses con gastos.</p>
            <BudgetForm
              categories={categories}
              budgets={Object.fromEntries(budgets.map((b) => [b.category_id, b.amount]))}
              averages={averages}
            />
          </section>
        </>
      )}
    </div>
  );
}

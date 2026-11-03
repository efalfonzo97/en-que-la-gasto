import type { Category, EmergencyFund, FixedExpense, Project, Transaction } from "@/lib/types";

/** Meses completos hacia atrás que se miran para estimar el gasto esencial. */
export const ESSENTIAL_LOOKBACK_MONTHS = 3;

export const EMERGENCY_MONTH_OPTIONS = [3, 6, 9, 12];

export type EssentialEstimate = {
  /** Gasto esencial estimado por mes, en pesos. */
  monthly: number;
  /** "promedio" de los últimos meses, "fijos" si no hay historia, o "ninguno". */
  source: "promedio" | "fijos" | "ninguno";
  /** Cuántos meses con datos entraron en el promedio. */
  monthsUsed: number;
  byCategory: { category: Category; monthly: number }[];
};

/**
 * Cuánto gasta el hogar por mes en lo esencial (categorías marcadas como
 * esenciales en Ajustes). Usa el promedio de los meses completos recientes que
 * tienen gastos cargados. Si todavía no hay historia, usa los fijos esenciales.
 */
export function essentialEstimate(
  pastTransactions: Transaction[],
  categories: Category[],
  fixed: FixedExpense[],
): EssentialEstimate {
  const essential = categories.filter((c) => c.kind === "egreso" && c.essential);
  const essentialIds = new Set(essential.map((c) => c.id));
  const paid = pastTransactions.filter((t) => t.currency === "ARS" && t.status === "pagado" && t.type === "egreso");

  // Meses con algún gasto cargado (esencial o no), para no promediar meses vacíos.
  const monthsWithData = new Set(paid.map((t) => t.date.slice(0, 7)));
  const monthsUsed = monthsWithData.size;

  if (monthsUsed > 0) {
    const essentialPaid = paid.filter((t) => t.category_id && essentialIds.has(t.category_id));
    const byCategory = essential
      .map((c) => ({
        category: c,
        monthly: essentialPaid.filter((t) => t.category_id === c.id).reduce((s, t) => s + t.amount, 0) / monthsUsed,
      }))
      .filter((r) => r.monthly > 0)
      .sort((a, b) => b.monthly - a.monthly);
    const monthly = byCategory.reduce((s, r) => s + r.monthly, 0);
    if (monthly > 0) return { monthly, source: "promedio", monthsUsed, byCategory };
  }

  const fixedEssential = fixed.filter((f) => f.category_id && essentialIds.has(f.category_id));
  const byCategory = essential
    .map((c) => ({
      category: c,
      monthly: fixedEssential.filter((f) => f.category_id === c.id).reduce((s, f) => s + f.amount, 0),
    }))
    .filter((r) => r.monthly > 0)
    .sort((a, b) => b.monthly - a.monthly);
  const monthly = byCategory.reduce((s, r) => s + r.monthly, 0);
  return { monthly, source: monthly > 0 ? "fijos" : "ninguno", monthsUsed: 0, byCategory };
}

/** Meta sugerida del fondo, en la moneda elegida. null si falta la cotización. */
export function suggestedTarget(monthlyArs: number, months: number, currency: "ARS" | "USD", usdRate: number | null) {
  const ars = monthlyArs * months;
  if (currency === "ARS") return Math.round(ars);
  if (!usdRate) return null;
  return Math.round(ars / usdRate);
}

/**
 * Cuántos meses de gastos esenciales cubre lo juntado.
 * null si no se puede calcular (sin gasto esencial o fondo en dólares sin cotización).
 */
export function monthsCovered(saved: number, project: Pick<Project, "currency">, fund: EmergencyFund, monthlyArs: number) {
  if (monthlyArs <= 0) return null;
  const savedArs = project.currency === "USD" ? (fund.usd_rate ? saved * fund.usd_rate : null) : saved;
  if (savedArs === null) return null;
  return savedArs / monthlyArs;
}

/** "2,5" o "6": meses con un decimal, sin ",0". */
export function formatMonths(n: number) {
  const rounded = Math.floor(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

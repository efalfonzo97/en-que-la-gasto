import type { Member, Shares, Transaction } from "@/lib/types";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Partes iguales entre todos los miembros. */
export function equalShares(members: Member[]): Record<string, number> {
  const pct = members.length ? 100 / members.length : 0;
  return Object.fromEntries(members.map((m) => [m.id, round2(pct)]));
}

/** Porcentaje de cada miembro en un movimiento (o fijo). */
export function resolveShares(
  item: { for_member: string | null; shares: Shares },
  members: Member[],
): Record<string, number> {
  if (item.for_member) return { [item.for_member]: 100 };
  if (!item.shares) return equalShares(members);
  return Object.fromEntries(members.map((m) => [m.id, Number(item.shares?.[m.id] ?? 0)]));
}

/** Cuánto le corresponde a cada miembro de un movimiento. */
export function splitAmounts(tx: Pick<Transaction, "amount" | "for_member" | "shares">, members: Member[]) {
  const shares = resolveShares(tx, members);
  return members.map((m) => ({ member: m, pct: shares[m.id] ?? 0, amount: (tx.amount * (shares[m.id] ?? 0)) / 100 }));
}

/** Texto corto del reparto, por ejemplo "60/40". Vacío si es 50/50. */
export function sharesLabel(shares: Shares, members: Member[]) {
  if (!shares) return "";
  return members.map((m) => formatPct(Number(shares[m.id] ?? 0))).join("/");
}

export function formatPct(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

/**
 * Valida el reparto que llega del formulario. Devuelve null para partes iguales.
 * Lanza un Error con un mensaje para mostrar si los porcentajes no cierran.
 */
export function parseShares(raw: string, members: Member[]): Shares {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const input = data as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const m of members) {
    const value = Number(input[m.id] ?? 0);
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error("Cada porcentaje tiene que estar entre 0 y 100.");
    result[m.id] = round2(value);
  }
  const total = Object.values(result).reduce((s, v) => s + v, 0);
  if (Math.abs(total - 100) > 0.5) throw new Error(`El reparto tiene que sumar 100% (ahora suma ${formatPct(round2(total))}%).`);
  const values = Object.values(result);
  if (values.every((v) => Math.abs(v - values[0]) < 0.01)) return null;
  return result;
}

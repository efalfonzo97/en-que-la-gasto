import { cookies } from "next/headers";
import type { FixedExpense, Transaction } from "@/lib/types";

/** "hogar" = todo lo del hogar; "yo" = solo lo que pagó o cobró el usuario. */
export type View = "hogar" | "yo";

export const VIEW_COOKIE = "vista";

/** La vista elegida: la del link, o la última que se usó (cookie). */
export async function getView(param: unknown): Promise<View> {
  if (param === "yo" || param === "hogar") return param;
  const saved = (await cookies()).get(VIEW_COOKIE)?.value;
  return saved === "yo" ? "yo" : "hogar";
}

/** Movimientos del usuario: los que pagó o cobró, y los que son para él. */
export function isMine(t: Pick<Transaction, "paid_by" | "for_member">, memberId: string) {
  return t.paid_by === memberId || t.for_member === memberId;
}

/** Fijos del usuario: los que paga él, o los que son para él sin pagador fijo. */
export function isMyFixed(f: FixedExpense, memberId: string) {
  return f.paid_by === memberId || (!f.paid_by && f.for_member === memberId);
}

/** Arma un link conservando parámetros, sin los vacíos. */
export function withQuery(path: string, params: Record<string, string | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

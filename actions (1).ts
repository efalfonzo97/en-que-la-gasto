"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { parseAmount } from "@/lib/import";
import { today } from "@/lib/format";
import { parseShares } from "@/lib/split";
import type { Member, Shares } from "@/lib/types";

export type FormState = { error?: string };

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function orNull(value: string) {
  return value === "" || value === "compartido" ? null : value;
}

/** Reparto del formulario: solo para gastos compartidos. */
function sharesFrom(formData: FormData, members: Member[], shared: boolean): Shares {
  return shared ? parseShares(str(formData, "shares"), members) : null;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveTransaction(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, me, members } = await getContext();
  const id = str(formData, "id");
  const amount = parseAmount(str(formData, "amount"));
  if (amount === null || amount === 0) return { error: "Poné un importe válido." };

  const type = str(formData, "type");
  if (!["ingreso", "egreso", "transferencia"].includes(type)) return { error: "Tipo inválido." };

  const forMember = orNull(str(formData, "for_member"));
  let shares: Shares;
  try {
    shares = sharesFrom(formData, members, type === "egreso" && !forMember);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const row = {
    household_id: me.household_id,
    type,
    amount,
    date: str(formData, "date") || today(),
    status: formData.get("pending") === "on" ? "pendiente" : "pagado",
    currency: str(formData, "currency") === "USD" ? "USD" : "ARS",
    category_id: orNull(str(formData, "category_id")),
    description: str(formData, "description"),
    paid_by: orNull(str(formData, "paid_by")),
    for_member: forMember,
    shares,
    account_id: orNull(str(formData, "account_id")),
    note: str(formData, "note") || null,
  };

  const { error } = id
    ? await supabase.from("transactions").update(row).eq("id", id)
    : await supabase.from("transactions").insert(row);
  if (error) return { error: error.message };

  refresh();
  redirect(id ? "/movimientos" : "/?cargado=1");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("transactions").delete().eq("id", str(formData, "id"));
  refresh();
  redirect("/movimientos");
}

/** Marca un fijo como pagado este mes: crea el movimiento. */
export async function payFixed(formData: FormData) {
  const { supabase, me } = await getContext();
  const fixedId = str(formData, "fixed_id");
  const { data: fixed } = await supabase.from("fixed_expenses").select("*").eq("id", fixedId).single();
  if (!fixed) return;

  const amount = parseAmount(str(formData, "amount")) ?? Number(fixed.amount);
  await supabase.from("transactions").insert({
    household_id: me.household_id,
    type: "egreso",
    status: "pagado",
    date: str(formData, "date") || today(),
    amount,
    category_id: fixed.category_id,
    description: fixed.description,
    paid_by: orNull(str(formData, "paid_by")) ?? fixed.paid_by ?? me.id,
    for_member: fixed.for_member,
    shares: fixed.for_member ? null : (fixed.shares ?? null),
    account_id: fixed.account_id,
    fixed_expense_id: fixed.id,
  });
  refresh();
}

export async function unpayFixed(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("transactions").delete().eq("id", str(formData, "transaction_id"));
  refresh();
}

export async function saveFixed(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, me, members } = await getContext();
  const id = str(formData, "id");
  const description = str(formData, "description");
  if (!description) return { error: "Poné una descripción." };
  const dueDay = Number(str(formData, "due_day"));
  const forMember = orNull(str(formData, "for_member"));
  let shares: Shares;
  try {
    shares = sharesFrom(formData, members, !forMember);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const row = {
    household_id: me.household_id,
    description,
    amount: parseAmount(str(formData, "amount")) ?? 0,
    due_day: dueDay >= 1 && dueDay <= 31 ? dueDay : null,
    category_id: orNull(str(formData, "category_id")),
    paid_by: orNull(str(formData, "paid_by")),
    for_member: forMember,
    shares,
    account_id: orNull(str(formData, "account_id")),
  };
  const { error } = id
    ? await supabase.from("fixed_expenses").update(row).eq("id", id)
    : await supabase.from("fixed_expenses").insert(row);
  if (error) return { error: error.message };
  refresh();
  redirect("/fijos");
}

export async function deactivateFixed(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("fixed_expenses").update({ active: false }).eq("id", str(formData, "id"));
  refresh();
  redirect("/fijos");
}

// --- Ajustes ---

export async function updateHousehold(formData: FormData) {
  const { supabase, me } = await getContext();
  const name = str(formData, "name");
  if (name) await supabase.from("households").update({ name }).eq("id", me.household_id);
  refresh();
}

export async function updateMember(formData: FormData) {
  const { supabase } = await getContext();
  const name = str(formData, "name");
  await supabase
    .from("members")
    .update({ ...(name ? { name } : {}), monthly_income: parseAmount(str(formData, "monthly_income")) ?? 0 })
    .eq("id", str(formData, "id"));
  refresh();
}

export async function saveCategory(formData: FormData) {
  const { supabase, me } = await getContext();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return;
  const row = {
    household_id: me.household_id,
    name,
    emoji: str(formData, "emoji") || "📦",
    kind: str(formData, "kind") === "ingreso" ? "ingreso" : "egreso",
    essential: formData.get("essential") === "on",
  };
  if (id) await supabase.from("categories").update(row).eq("id", id);
  else await supabase.from("categories").insert({ ...row, sort: 50 });
  refresh();
}

export async function toggleCategoryArchived(formData: FormData) {
  const { supabase } = await getContext();
  await supabase
    .from("categories")
    .update({ archived: str(formData, "archived") !== "true" })
    .eq("id", str(formData, "id"));
  refresh();
}

export async function saveAccount(formData: FormData) {
  const { supabase, me } = await getContext();
  const name = str(formData, "name");
  if (!name) return;
  await supabase.from("accounts").insert({
    household_id: me.household_id,
    name,
    currency: str(formData, "currency") === "USD" ? "USD" : "ARS",
  });
  refresh();
}

export async function toggleAccountArchived(formData: FormData) {
  const { supabase } = await getContext();
  await supabase
    .from("accounts")
    .update({ archived: str(formData, "archived") !== "true" })
    .eq("id", str(formData, "id"));
  refresh();
}

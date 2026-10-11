"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { parseAmount } from "@/lib/import";
import { today } from "@/lib/format";

export type ProjectFormState = { error?: string };

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function orNull(value: string) {
  return value === "" || value === "compartido" ? null : value;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveProject(_: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { supabase, me } = await getContext();
  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return { error: "Poné un título." };
  const target = parseAmount(str(formData, "target_amount"));
  if (target === null || target <= 0) return { error: "Poné cuánto querés juntar." };

  const row = {
    household_id: me.household_id,
    title,
    description: str(formData, "description"),
    target_amount: target,
    currency: str(formData, "currency") === "USD" ? "USD" : "ARS",
    for_member: orNull(str(formData, "for_member")),
  };

  if (id) {
    const { error } = await supabase.from("projects").update(row).eq("id", id);
    if (error) return { error: error.message };
    refresh();
    redirect(`/proyectos/${id}`);
  }

  const { data, error } = await supabase.from("projects").insert(row).select("id").single();
  if (error || !data) return { error: error?.message ?? "No se pudo guardar." };
  refresh();
  redirect(`/proyectos/${data.id}`);
}

/**
 * Carga un aporte: crea un movimiento de ahorro que descuenta del disponible.
 * En proyectos en dólares, "amount" son los US$ que suman al proyecto y "pesos"
 * lo que salió del sueldo para comprarlos (opcional).
 */
export async function addContribution(_: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { supabase, me } = await getContext();
  const projectId = str(formData, "project_id");
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, currency, for_member")
    .eq("id", projectId)
    .single();
  if (!project) return { error: "No se encontró el proyecto." };

  const amount = parseAmount(str(formData, "amount"));
  if (amount === null || amount <= 0) return { error: "Poné cuánto aportaste." };

  const isUsd = project.currency === "USD";
  const pesos = isUsd ? parseAmount(str(formData, "pesos")) : null;
  if (pesos !== null && pesos < 0) return { error: "Los pesos no pueden ser negativos." };
  const usesPesos = isUsd && pesos !== null && pesos > 0;

  const { error } = await supabase.from("transactions").insert({
    household_id: me.household_id,
    type: "transferencia",
    status: "pagado",
    date: str(formData, "date") || today(),
    // Si se compraron dólares con pesos, el movimiento es en pesos para que baje el disponible.
    amount: usesPesos ? pesos : amount,
    currency: usesPesos ? "ARS" : project.currency,
    project_amount: usesPesos ? amount : null,
    project_id: project.id,
    description: `Aporte: ${project.title}`,
    paid_by: orNull(str(formData, "paid_by")) ?? me.id,
    for_member: project.for_member,
    account_id: orNull(str(formData, "account_id")),
    note: str(formData, "note") || null,
  });
  if (error) return { error: error.message };

  refresh();
  redirect(`/proyectos/${project.id}?aporte=1`);
}

export async function toggleProjectArchived(formData: FormData) {
  const { supabase } = await getContext();
  const id = str(formData, "id");
  await supabase.from("projects").update({ archived: str(formData, "archived") !== "true" }).eq("id", id);
  refresh();
  redirect("/proyectos");
}

/** Borra el proyecto. Los aportes quedan como movimientos de ahorro comunes. */
export async function deleteProject(formData: FormData) {
  const { supabase } = await getContext();
  await supabase.from("projects").delete().eq("id", str(formData, "id"));
  refresh();
  redirect("/proyectos");
}

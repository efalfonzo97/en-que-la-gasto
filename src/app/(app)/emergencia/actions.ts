"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { parseAmount } from "@/lib/import";
import { getEmergencyFund, getProject } from "@/lib/queries";

export type EmergencyFormState = { error?: string };

const TITLE = "Fondo de emergencia";
const DESCRIPTION = "Plata para cubrir los gastos esenciales si se corta un ingreso o surge un imprevisto.";

/**
 * Crea o actualiza el fondo de emergencia. El fondo es un proyecto compartido
 * (los aportes se cargan igual que en cualquier proyecto) más la cantidad de
 * meses a cubrir y, si es en dólares, la cotización.
 */
export async function saveEmergencyFund(_: EmergencyFormState, formData: FormData): Promise<EmergencyFormState> {
  const ctx = await getContext();
  const { supabase, me } = ctx;

  const months = Number(formData.get("months"));
  if (!Number.isInteger(months) || months < 1 || months > 24) return { error: "Elegí entre 1 y 24 meses." };
  const target = parseAmount(String(formData.get("target_amount") ?? "").trim());
  if (target === null || target <= 0) return { error: "Poné cuánto querés juntar." };
  const rateText = String(formData.get("usd_rate") ?? "").trim();
  const usdRate = rateText ? parseAmount(rateText) : null;
  if (usdRate !== null && usdRate <= 0) return { error: "La cotización tiene que ser mayor a 0." };

  const { ready, fund } = await getEmergencyFund(ctx);
  if (!ready) return { error: "Falta correr la migración 0005 en Supabase (ver README)." };
  const existing = fund?.project_id ? await getProject(ctx, fund.project_id) : null;

  // La moneda solo se elige al crear el fondo, para no mezclar aportes.
  const currency = existing ? existing.currency : formData.get("currency") === "USD" ? "USD" : "ARS";
  if (currency === "USD" && !usdRate) return { error: "Poné la cotización del dólar para calcular los meses cubiertos." };

  let projectId = existing?.id ?? null;
  if (existing) {
    const { error } = await supabase.from("projects").update({ target_amount: target, archived: false }).eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("projects")
      .insert({ household_id: me.household_id, title: TITLE, description: DESCRIPTION, target_amount: target, currency, for_member: null })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "No se pudo crear el fondo." };
    projectId = data.id;
  }

  const { error } = await supabase
    .from("emergency_funds")
    .upsert({ household_id: me.household_id, project_id: projectId, months, usd_rate: usdRate }, { onConflict: "household_id" });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/emergencia?guardado=1");
}

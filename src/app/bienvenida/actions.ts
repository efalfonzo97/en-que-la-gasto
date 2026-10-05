"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

export async function createHousehold(_: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", {
    household_name: String(formData.get("household") ?? "").trim() || "Nuestro hogar",
    my_name: String(formData.get("me") ?? "").trim(),
    partner_name: String(formData.get("partner") ?? "").trim(),
  });
  if (error) return { error: error.message };
  redirect("/");
}

export async function joinHousehold(_: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household", {
    code: String(formData.get("code") ?? ""),
    my_name: String(formData.get("me") ?? "").trim(),
  });
  if (error) return { error: error.message };
  redirect("/");
}

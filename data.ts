import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Account, Category, Household, Member } from "@/lib/types";

/** Usuario, hogar y catálogos. Redirige si no hay sesión o no hay hogar. */
export const getContext = cache(async () => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: me } = await supabase
    .from("members")
    .select("id, household_id, user_id, name, monthly_income")
    .eq("user_id", userId)
    .maybeSingle<Member>();
  if (!me) redirect("/bienvenida");

  const [household, members, categories, accounts] = await Promise.all([
    supabase.from("households").select("id, name, invite_code, currency").eq("id", me.household_id).single<Household>(),
    supabase.from("members").select("id, household_id, user_id, name, monthly_income").eq("household_id", me.household_id).order("created_at"),
    supabase.from("categories").select("id, name, emoji, kind, essential, archived, sort").eq("household_id", me.household_id).order("sort").order("name"),
    supabase.from("accounts").select("id, name, currency, archived").eq("household_id", me.household_id).order("name"),
  ]);

  return {
    supabase,
    userId,
    me,
    household: household.data!,
    members: (members.data ?? []) as Member[],
    categories: (categories.data ?? []) as Category[],
    accounts: (accounts.data ?? []) as Account[],
  };
});

export type AppContext = Awaited<ReturnType<typeof getContext>>;

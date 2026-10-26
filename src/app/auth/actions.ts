"use server";

import { createClient } from "@/lib/supabase/server";

// Guarda en cookies la sesión que Supabase manda en el "#..." de algunos links.
export async function setSessionFromLink(accessToken: string, refreshToken: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  return { ok: !error };
}

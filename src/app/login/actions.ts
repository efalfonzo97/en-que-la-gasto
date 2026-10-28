"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanName, isPinEmail } from "@/lib/pin";
import { findPinLogin } from "@/lib/pin-login";

export type AuthState = { error?: string; message?: string };

/** "Olvidé mi PIN": manda el link al email del perfil (o al email escrito, para cuentas viejas). */
export async function requestPinReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const input = cleanName(String(formData.get("name") ?? ""));
  if (!input) return { error: "Poné tu nombre." };

  let email = input.includes("@") ? input : null;
  if (!email) {
    const admin = createAdminClient();
    const login = await findPinLogin(admin, input);
    if (!login) return { error: "No encontramos ese nombre." };
    const { data } = await admin.auth.admin.getUserById(login.user_id);
    email = data.user?.email ?? null;
    if (!email || isPinEmail(email)) {
      return { error: "Ese usuario no tiene un email cargado. Pedile a alguien del hogar que te ayude." };
    }
  }

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/nueva-clave`,
  });
  if (error) return { error: "No pudimos mandar el email. Probá de nuevo en un rato." };
  return { message: "Te mandamos un link al email de tu perfil para elegir un PIN nuevo. Abrilo desde este dispositivo." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

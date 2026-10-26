"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string };

export async function updatePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error: error.code === "same_password"
        ? "Elegí una contraseña distinta a la anterior."
        : "No pudimos cambiar la contraseña. Pedí un link nuevo e intentá otra vez.",
    };
  }
  redirect("/");
}

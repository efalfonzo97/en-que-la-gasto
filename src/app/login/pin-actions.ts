"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanName, hashPin, LOCK_MINUTES, MAX_ATTEMPTS, pinEmail, pinError, verifyPin } from "@/lib/pin";
import type { AuthState } from "./actions";

type PinLogin = {
  user_id: string;
  username: string;
  pin_hash: string;
  failed_attempts: number;
  locked_until: string | null;
};

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

// ilike sin comodines: compara el nombre ignorando mayúsculas.
const exactly = (name: string) => name.replace(/[\\%_]/g, "\\$&");

async function findLogin(admin: ReturnType<typeof createAdminClient>, name: string) {
  const { data } = await admin
    .from("pin_logins")
    .select("user_id, username, pin_hash, failed_attempts, locked_until")
    .ilike("username", exactly(name))
    .maybeSingle<PinLogin>();
  return data;
}

function checkNewPin(formData: FormData): string | null {
  const pin = field(formData, "pin");
  return pinError(pin) ?? (pin === field(formData, "confirm") ? null : "Los PIN no coinciden.");
}

/** Crea el usuario de Supabase con email inventado y guarda su nombre y PIN. */
async function createPinUser(admin: ReturnType<typeof createAdminClient>, name: string, pin: string) {
  const email = pinEmail();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user) return { error: "No se pudo crear la cuenta. Probá de nuevo." };

  const { error: insertError } = await admin
    .from("pin_logins")
    .insert({ user_id: data.user.id, username: name, pin_hash: await hashPin(pin) });
  if (insertError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return {
      error: insertError.code === "23505" ? "Ese nombre ya está en uso." : "No se pudo crear la cuenta. Probá de nuevo.",
    };
  }
  return { userId: data.user.id, email };
}

/** Inicia sesión sin mandar email: genera el link mágico y lo canjea acá mismo. */
async function startSession(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) return false;
  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: data.properties.hashed_token,
  });
  return !otpError;
}

export async function signUpWithPin(_: AuthState, formData: FormData): Promise<AuthState> {
  const name = cleanName(field(formData, "name"));
  if (!name) return { error: "Poné tu nombre." };
  const pinProblem = checkNewPin(formData);
  if (pinProblem) return { error: pinProblem };

  const admin = createAdminClient();
  if (await findLogin(admin, name)) return { error: "Ese nombre ya está en uso. Probá agregándole tu apellido." };

  const created = await createPinUser(admin, name, field(formData, "pin"));
  if ("error" in created) return { error: created.error };
  if (!(await startSession(admin, created.email))) return { error: "Se creó la cuenta pero no se pudo entrar. Probá entrar con tu nombre y PIN." };
  redirect("/bienvenida");
}

export async function joinWithPin(_: AuthState, formData: FormData): Promise<AuthState> {
  const code = field(formData, "code").trim().toUpperCase();
  const name = cleanName(field(formData, "name"));
  if (!code || !name) return { error: "Completá el código y tu nombre." };
  const pinProblem = checkNewPin(formData);
  if (pinProblem) return { error: pinProblem };

  const admin = createAdminClient();
  const { data: household } = await admin.from("households").select("id").eq("invite_code", code).maybeSingle();
  if (!household) return { error: "Código de invitación inválido." };

  const { data: slot } = await admin
    .from("members")
    .select("id, name")
    .eq("household_id", household.id)
    .is("user_id", null)
    .ilike("name", exactly(name))
    .limit(1)
    .maybeSingle();
  if (!slot) return { error: "Ese nombre no está invitado en este hogar. Fijate cómo te anotó quien te invitó." };

  if (await findLogin(admin, slot.name)) {
    return { error: "Ese nombre ya lo usa otra cuenta. Pedile a quien te invitó que te anote con otro (por ejemplo con tu apellido)." };
  }

  const created = await createPinUser(admin, slot.name, field(formData, "pin"));
  if ("error" in created) return { error: created.error };

  const { data: claimed } = await admin
    .from("members")
    .update({ user_id: created.userId })
    .eq("id", slot.id)
    .is("user_id", null)
    .select("id");
  if (!claimed?.length) {
    await admin.auth.admin.deleteUser(created.userId);
    return { error: "Esa invitación ya se usó." };
  }

  if (!(await startSession(admin, created.email))) return { error: "Ya estás en el hogar. Entrá con tu nombre y PIN." };
  redirect("/");
}

export async function signInWithPin(_: AuthState, formData: FormData): Promise<AuthState> {
  const name = cleanName(field(formData, "name"));
  const pin = field(formData, "pin");
  const wrong = { error: "Nombre o PIN incorrectos." };
  if (!name || pinError(pin)) return wrong;

  const admin = createAdminClient();
  const login = await findLogin(admin, name);
  if (!login) return wrong;

  if (login.locked_until && new Date(login.locked_until) > new Date()) {
    const minutes = Math.ceil((new Date(login.locked_until).getTime() - Date.now()) / 60000);
    return { error: `Demasiados intentos. Probá de nuevo en ${minutes} min.` };
  }

  if (!(await verifyPin(pin, login.pin_hash))) {
    const attempts = login.failed_attempts + 1;
    const locked = attempts >= MAX_ATTEMPTS;
    await admin
      .from("pin_logins")
      .update({
        failed_attempts: locked ? 0 : attempts,
        locked_until: locked ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null,
      })
      .eq("user_id", login.user_id);
    return locked ? { error: `Demasiados intentos. Probá de nuevo en ${LOCK_MINUTES} min.` } : wrong;
  }

  if (login.failed_attempts || login.locked_until) {
    await admin.from("pin_logins").update({ failed_attempts: 0, locked_until: null }).eq("user_id", login.user_id);
  }

  const { data } = await admin.auth.admin.getUserById(login.user_id);
  if (!data.user?.email || !(await startSession(admin, data.user.email))) {
    return { error: "No se pudo entrar. Probá de nuevo." };
  }
  redirect("/");
}

export async function changePin(_: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const pinProblem = checkNewPin(formData);
  if (pinProblem) return { error: pinProblem };

  const admin = createAdminClient();
  const { data: login } = await admin
    .from("pin_logins")
    .select("pin_hash")
    .eq("user_id", userId)
    .maybeSingle<Pick<PinLogin, "pin_hash">>();
  if (!login || !(await verifyPin(field(formData, "current"), login.pin_hash))) {
    return { error: "El PIN actual no es correcto." };
  }

  await admin
    .from("pin_logins")
    .update({ pin_hash: await hashPin(field(formData, "pin")), failed_attempts: 0, locked_until: null })
    .eq("user_id", userId);
  return { message: "Listo, ya podés entrar con el PIN nuevo." };
}

import type { createAdminClient } from "@/lib/supabase/admin";

export type PinLogin = {
  user_id: string;
  username: string;
  pin_hash: string;
  failed_attempts: number;
  locked_until: string | null;
};

type Admin = ReturnType<typeof createAdminClient>;

const COLUMNS = "user_id, username, pin_hash, failed_attempts, locked_until";

// ilike sin comodines: compara el nombre ignorando mayúsculas.
const exactly = (name: string) => name.replace(/[\\%_]/g, "\\$&");

export async function findPinLogin(admin: Admin, name: string) {
  const { data } = await admin.from("pin_logins").select(COLUMNS).ilike("username", exactly(name)).maybeSingle<PinLogin>();
  return data;
}

export async function pinLoginOf(admin: Admin, userId: string) {
  const { data } = await admin.from("pin_logins").select(COLUMNS).eq("user_id", userId).maybeSingle<PinLogin>();
  return data;
}

export { exactly };

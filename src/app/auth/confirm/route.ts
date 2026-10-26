import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Link de los emails de Supabase (confirmar cuenta o recuperar contraseña).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Link inválido") };

  if (error) return NextResponse.redirect(new URL("/login?error=link", origin));
  // Si viene de "olvidé mi contraseña", lleva a elegir una nueva.
  const recovery = type === "recovery" || searchParams.get("next") === "/nueva-clave";
  return NextResponse.redirect(new URL(recovery ? "/nueva-clave" : "/", origin));
}

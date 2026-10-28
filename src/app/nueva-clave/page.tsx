import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pinLoginOf } from "@/lib/pin-login";
import { PinForm } from "./pin-form";

// Se llega desde el link de "olvidé mi PIN" (ya con sesión) o desde Ajustes,
// en cuentas viejas de email que todavía no tienen nombre y PIN.
export default async function NewPinPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const login = await pinLoginOf(createAdminClient(), userId);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <Image src="/logo.png" alt="" width={96} height={130} priority className="mx-auto h-28 w-auto drop-shadow-md" />
        <h1 className="mt-2 text-2xl font-bold">{login ? "Elegí tu PIN nuevo" : "Elegí tu nombre y PIN"}</h1>
        <p className="text-muted">{login ? `Para entrar como ${login.username}.` : "Desde ahora vas a entrar con estos dos datos."}</p>
      </div>
      <PinForm askName={!login} />
    </main>
  );
}

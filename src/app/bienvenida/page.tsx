import { createClient } from "@/lib/supabase/server";
import { CreateHouseholdForm, JoinHouseholdForm } from "./forms";

export default async function WelcomePage() {
  // Las cuentas con nombre y PIN ya traen el nombre: se usa para "Tu nombre".
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const metadata = data?.claims?.user_metadata as { name?: string } | undefined;
  const name = metadata?.name ?? "";

  return (
    <main className="mx-auto max-w-sm space-y-4 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">¡Hola{name ? `, ${name}` : ""}! 👋</h1>
        <p className="text-muted">
          Creá el hogar y después compartí el código con quien quieras sumar, o unite con el código que te pasaron.
        </p>
      </div>
      <CreateHouseholdForm defaultName={name} />
      <JoinHouseholdForm defaultName={name} />
    </main>
  );
}

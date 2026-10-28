import Link from "next/link";
import { getContext } from "@/lib/data";
import { pinLoginOf } from "@/lib/pin-login";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnimatedBackground } from "@/components/animated-background";
import { BottomNav } from "./nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { userId } = await getContext();
  // Cuentas viejas de email: sin nombre y PIN no van a poder volver a entrar.
  const needsPin = !(await pinLoginOf(createAdminClient(), userId));
  return (
    <>
      <AnimatedBackground />
      <main className="mx-auto max-w-lg px-4 pt-6 pb-28">
        {needsPin && (
          <Link href="/nueva-clave" className="card mb-4 block border-accent bg-accent-soft text-sm">
            <b>Elegí tu nombre y PIN.</b> Ya no se entra con email: tocá acá antes de cerrar sesión.
          </Link>
        )}
        {children}
      </main>
      <BottomNav />
    </>
  );
}

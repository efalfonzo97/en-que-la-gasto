import Image from "next/image";
import { PasswordForm } from "./password-form";

// Se llega desde el link de "olvidé mi contraseña" (ya con sesión) o desde Configuración.
export default function NewPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <Image src="/logo.png" alt="" width={96} height={130} priority className="mx-auto h-28 w-auto drop-shadow-md" />
        <h1 className="mt-2 text-2xl font-bold">Elegí tu contraseña nueva</h1>
        <p className="text-muted">Al menos 8 caracteres.</p>
      </div>
      <PasswordForm />
    </main>
  );
}

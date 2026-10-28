import Image from "next/image";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <Image src="/logo.png" alt="" width={96} height={130} priority className="mx-auto h-28 w-auto drop-shadow-md" />
        <h1 className="mt-2 text-2xl font-bold">En qué la gasto</h1>
        <p className="text-muted">Mirá cómo tirás guita.</p>
      </div>
      <LoginForm linkError={error === "link"} />
    </main>
  );
}

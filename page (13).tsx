import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <div className="text-4xl">💸</div>
        <h1 className="mt-2 text-2xl font-bold">En qué la gasto</h1>
        <p className="text-muted">Las finanzas del hogar, entre los dos.</p>
      </div>
      <LoginForm />
    </main>
  );
}

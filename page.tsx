import { CreateHouseholdForm, JoinHouseholdForm } from "./forms";

export default function WelcomePage() {
  return (
    <main className="mx-auto max-w-sm space-y-4 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">¡Hola! 👋</h1>
        <p className="text-muted">
          Creá el hogar y después compartí el código con tu pareja, o unite con el código que te pasaron.
        </p>
      </div>
      <CreateHouseholdForm />
      <JoinHouseholdForm />
    </main>
  );
}

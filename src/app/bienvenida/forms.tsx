"use client";

import { useActionState } from "react";
import { createHousehold, joinHousehold, type OnboardingState } from "./actions";

export function CreateHouseholdForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createHousehold, {});
  return (
    <form action={action} className="card space-y-3">
      <h2 className="font-semibold">Crear el hogar</h2>
      <div>
        <label className="label" htmlFor="household">Nombre del hogar</label>
        <input className="input" id="household" name="household" placeholder="Casa" />
      </div>
      <div>
        <label className="label" htmlFor="me">Tu nombre</label>
        <input className="input" id="me" name="me" required />
      </div>
      <div>
        <label className="label" htmlFor="partner">Nombre de tu pareja</label>
        <input className="input" id="partner" name="partner" />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>Crear</button>
    </form>
  );
}

export function JoinHouseholdForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(joinHousehold, {});
  return (
    <form action={action} className="card space-y-3">
      <h2 className="font-semibold">Unirme con un código</h2>
      <div>
        <label className="label" htmlFor="code">Código de invitación</label>
        <input className="input uppercase" id="code" name="code" required autoCapitalize="characters" />
      </div>
      <div>
        <label className="label" htmlFor="me-join">Tu nombre</label>
        <input className="input" id="me-join" name="me" required />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn-ghost w-full" disabled={pending}>Unirme</button>
    </form>
  );
}

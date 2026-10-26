"use client";

import { useActionState } from "react";
import { updatePassword, type PasswordState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(updatePassword, {});

  return (
    <form action={action} className="card space-y-4">
      <div>
        <label className="label" htmlFor="password">Contraseña nueva</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Repetila</label>
        <input className="input" id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>Guardar contraseña</button>
    </form>
  );
}

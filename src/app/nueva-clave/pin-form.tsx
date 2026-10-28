"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/login/actions";
import { setPin } from "@/app/login/pin-actions";

export function PinForm({ askName }: { askName: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(setPin, {});
  const pinInput = { className: "input tracking-widest", type: "password", inputMode: "numeric", pattern: "[0-9]{4,6}", maxLength: 6, required: true, autoComplete: "new-password" } as const;

  return (
    <form action={action} className="card space-y-4">
      {askName && (
        <div>
          <label className="label" htmlFor="name">Nombre</label>
          <input className="input" id="name" name="name" autoComplete="username" autoCapitalize="words" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="pin">PIN nuevo (4 a 6 números)</label>
        <input {...pinInput} id="pin" name="pin" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Repetilo</label>
        <input {...pinInput} id="confirm" name="confirm" />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>Guardar PIN</button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { changePin, setRecoveryEmail } from "@/app/login/pin-actions";
import type { AuthState } from "@/app/login/actions";
import { addMember, type FormState } from "../actions";

export function InviteForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addMember, {});
  return (
    <form action={action} className="space-y-2 border-t border-border pt-3">
      <div className="flex gap-2">
        <input className="input flex-1" name="name" placeholder="Nombre de quien invitás" required aria-label="Nombre" />
        <button className="btn px-3" disabled={pending} aria-label="Invitar">+</button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}

export function ChangePinForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(changePin, {});
  const pinInput = { className: "input tracking-widest", type: "password", inputMode: "numeric", pattern: "[0-9]{4,6}", maxLength: 6, required: true } as const;
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="current-pin">PIN actual</label>
        <input {...pinInput} id="current-pin" name="current" autoComplete="current-password" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="label" htmlFor="new-pin">PIN nuevo</label>
          <input {...pinInput} id="new-pin" name="pin" autoComplete="new-password" />
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="confirm-pin">Repetilo</label>
          <input {...pinInput} id="confirm-pin" name="confirm" autoComplete="new-password" />
        </div>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.message && <p className="text-sm text-accent">{state.message}</p>}
      <button className="btn-ghost w-full" disabled={pending}>Cambiar PIN</button>
    </form>
  );
}

export function RecoveryEmailForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(setRecoveryEmail, {});
  return (
    <form action={action} className="space-y-2 border-b border-border pb-3">
      <label className="label" htmlFor="recovery-email">Email para recuperar el PIN (opcional)</label>
      <div className="flex gap-2">
        <input className="input flex-1" id="recovery-email" name="email" type="email" autoComplete="email" defaultValue={email} placeholder="vos@email.com" />
        <button className="btn-ghost" disabled={pending}>Guardar</button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.message && <p className="text-sm text-accent">{state.message}</p>}
    </form>
  );
}

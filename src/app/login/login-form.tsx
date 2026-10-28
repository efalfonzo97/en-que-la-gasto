"use client";

import { startTransition, useActionState, useState } from "react";
import { requestPinReset, type AuthState } from "./actions";
import { joinWithPin, signInWithPin, signUpWithPin } from "./pin-actions";

type Mode = "login" | "signup" | "join" | "reset";

const actions = { login: signInWithPin, signup: signUpWithPin, join: joinWithPin, reset: requestPinReset };

const pinInput = {
  className: "input tracking-widest",
  type: "password",
  inputMode: "numeric",
  pattern: "[0-9]{4,6}",
  maxLength: 6,
  required: true,
} as const;

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  return <ModeForm key={mode} mode={mode} setMode={setMode} linkError={linkError} />;
}

function ModeForm({ mode, setMode, linkError }: { mode: Mode; setMode: (m: Mode) => void; linkError?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(actions[mode], {});
  const isLogin = mode === "login";
  const choosesPin = mode === "signup" || mode === "join";

  return (
    <form
      className="card space-y-4"
      // Envía sin el reseteo automático del form: si hay un error no hay que volver a escribir todo.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      {mode === "signup" && <h2 className="font-semibold">Crear usuario</h2>}
      {mode === "join" && (
        <>
          <p className="text-sm text-muted">
            Poné el código que te pasaron y tu nombre tal como te anotaron. Después elegí un PIN para entrar las próximas veces.
          </p>
          <div>
            <label className="label" htmlFor="code">Código de invitación</label>
            <input className="input uppercase" id="code" name="code" required autoCapitalize="characters" autoComplete="off" />
          </div>
        </>
      )}
      {mode === "reset" && (
        <p className="text-sm text-muted">
          Poné tu nombre y te mandamos un link al email de tu perfil para elegir un PIN nuevo.
        </p>
      )}
      <div>
        <label className="label" htmlFor="name">
          {mode === "join" ? "Tu nombre (el que te asignaron)" : mode === "signup" ? "Nombre del perfil" : "Nombre"}
        </label>
        <input className="input" id="name" name="name" autoComplete="username" autoCapitalize="words" required />
      </div>
      {mode !== "reset" && (
        <div>
          <label className="label" htmlFor="pin">{isLogin ? "PIN" : "Elegí un PIN (4 a 6 números)"}</label>
          <input {...pinInput} id="pin" name="pin" autoComplete={isLogin ? "current-password" : "new-password"} />
        </div>
      )}
      {choosesPin && (
        <div>
          <label className="label" htmlFor="confirm">Repetí el PIN</label>
          <input {...pinInput} id="confirm" name="confirm" autoComplete="new-password" />
        </div>
      )}
      {linkError && isLogin && !state.error && (
        <p className="text-sm text-danger">El link venció o ya se usó. Pedí uno nuevo.</p>
      )}
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.message && <p className="text-sm text-accent">{state.message}</p>}
      <button className="btn w-full" disabled={pending}>
        {{ login: "Entrar", signup: "Crear usuario", join: "Unirme al hogar", reset: "Mandar link" }[mode]}
      </button>
      {isLogin ? (
        <>
          <button type="button" className="btn-ghost w-full" onClick={() => setMode("signup")}>
            Crear usuario
          </button>
          <button type="button" className="w-full text-sm text-muted underline" onClick={() => setMode("join")}>
            Tengo un código de invitación
          </button>
          <button type="button" className="w-full text-sm text-muted underline" onClick={() => setMode("reset")}>
            ¿Olvidaste tu PIN?
          </button>
        </>
      ) : (
        <button type="button" className="w-full text-sm text-muted underline" onClick={() => setMode("login")}>
          Volver a entrar
        </button>
      )}
    </form>
  );
}

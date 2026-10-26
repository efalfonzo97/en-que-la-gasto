"use client";

import { useActionState, useState } from "react";
import { requestPasswordReset, signIn, signUp, type AuthState } from "./actions";

type Mode = "login" | "signup" | "reset";

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(signIn, {});
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signUp, {});
  const [resetState, resetAction, resetPending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );
  const isLogin = mode === "login";
  const isReset = mode === "reset";
  const state = isLogin ? loginState : isReset ? resetState : signupState;
  const pending = isLogin ? loginPending : isReset ? resetPending : signupPending;
  const action = isLogin ? loginAction : isReset ? resetAction : signupAction;

  return (
    <form action={action} className="card space-y-4">
      {isReset && (
        <p className="text-sm text-muted">
          Escribí tu email y te mandamos un link para elegir una contraseña nueva.
        </p>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {!isReset && (
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={isLogin ? undefined : 8}
            required
          />
        </div>
      )}
      {linkError && isLogin && !state.error && (
        <p className="text-sm text-danger">El link venció o ya se usó. Pedí uno nuevo.</p>
      )}
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.message && <p className="text-sm text-accent">{state.message}</p>}
      <button className="btn w-full" disabled={pending}>
        {isLogin ? "Entrar" : isReset ? "Mandar link" : "Crear cuenta"}
      </button>
      {isLogin && (
        <button type="button" className="w-full text-sm text-muted underline" onClick={() => setMode("reset")}>
          ¿Olvidaste tu contraseña?
        </button>
      )}
      <button
        type="button"
        className="w-full text-sm text-muted underline"
        onClick={() => setMode(isLogin ? "signup" : "login")}
      >
        {isLogin ? "¿No tenés cuenta? Creala acá" : "Volver a entrar"}
      </button>
    </form>
  );
}

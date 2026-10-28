"use client";

import { startTransition, useActionState, useState } from "react";
import { requestPasswordReset, signIn, signUp, type AuthState } from "./actions";
import { joinWithPin, signInWithPin, signUpWithPin } from "./pin-actions";

type Method = "pin" | "email";

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [method, setMethod] = useState<Method>(linkError ? "email" : "pin");
  const options: { value: Method; label: string }[] = [
    { value: "pin", label: "Nombre y PIN" },
    { value: "email", label: "Email" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1" role="group" aria-label="Cómo entrar">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={method === o.value}
            onClick={() => setMethod(o.value)}
            className={`rounded-lg py-2 text-sm ${method === o.value ? "bg-accent-soft font-semibold ring-1 ring-accent" : "text-muted"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {method === "pin" ? <PinForm /> : <EmailForm linkError={linkError} />}
    </div>
  );
}

type PinMode = "login" | "signup" | "join";

function PinForm() {
  const [mode, setMode] = useState<PinMode>("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(signInWithPin, {});
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signUpWithPin, {});
  const [joinState, joinAction, joinPending] = useActionState<AuthState, FormData>(joinWithPin, {});
  const isLogin = mode === "login";
  const isJoin = mode === "join";
  const state = isLogin ? loginState : isJoin ? joinState : signupState;
  const pending = isLogin ? loginPending : isJoin ? joinPending : signupPending;
  const action = isLogin ? loginAction : isJoin ? joinAction : signupAction;

  return (
    <form
      key={mode}
      className="card space-y-4"
      // Envía sin el reseteo automático del form: si hay un error no hay que volver a escribir el código.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      {isJoin && (
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
      <div>
        <label className="label" htmlFor="name">{isJoin ? "Tu nombre (el que te asignaron)" : "Nombre"}</label>
        <input className="input" id="name" name="name" autoComplete="username" autoCapitalize="words" required />
      </div>
      <div>
        <label className="label" htmlFor="pin">{isLogin ? "PIN" : "Elegí un PIN (4 a 6 números)"}</label>
        <input
          className="input tracking-widest"
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4,6}"
          maxLength={6}
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
        />
      </div>
      {!isLogin && (
        <div>
          <label className="label" htmlFor="confirm">Repetí el PIN</label>
          <input
            className="input tracking-widest"
            id="confirm"
            name="confirm"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4,6}"
            maxLength={6}
            autoComplete="new-password"
            required
          />
        </div>
      )}
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>
        {isLogin ? "Entrar" : isJoin ? "Unirme al hogar" : "Crear cuenta"}
      </button>
      {isLogin ? (
        <>
          <button type="button" className="w-full text-sm text-muted underline" onClick={() => setMode("join")}>
            Tengo un código de invitación
          </button>
          <button type="button" className="w-full text-sm text-muted underline" onClick={() => setMode("signup")}>
            ¿No tenés cuenta? Creala acá
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

type Mode = "login" | "signup" | "reset";

function EmailForm({ linkError }: { linkError?: boolean }) {
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

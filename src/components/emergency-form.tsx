"use client";

import { useActionState, useState } from "react";
import { saveEmergencyFund, type EmergencyFormState } from "@/app/(app)/emergencia/actions";
import { EMERGENCY_MONTH_OPTIONS, suggestedTarget } from "@/lib/emergency";
import { formatMoney } from "@/lib/format";
import { parseAmount } from "@/lib/import";

type Props = {
  /** Gasto esencial estimado por mes, en pesos. */
  monthlyArs: number;
  months: number;
  /** Moneda del fondo ya creado (no se puede cambiar), o null si es nuevo. */
  lockedCurrency: "ARS" | "USD" | null;
  usdRate: number | null;
  target: number | null;
};

const asText = (n: number | null) => (n ? String(n).replace(".", ",") : "");

export function EmergencyForm({ monthlyArs, months: initialMonths, lockedCurrency, usdRate, target }: Props) {
  const [state, action, pending] = useActionState<EmergencyFormState, FormData>(saveEmergencyFund, {});
  const [months, setMonths] = useState(initialMonths);
  const [currency, setCurrency] = useState<"ARS" | "USD">(lockedCurrency ?? "ARS");
  const [rateText, setRateText] = useState(asText(usdRate));
  const suggestion = suggestedTarget(monthlyArs, months, currency, parseAmount(rateText));
  // La meta sigue a la sugerencia hasta que la persona la cambia a mano.
  const [targetText, setTargetText] = useState(asText(target));
  const [touched, setTouched] = useState(target !== null);
  const shownTarget = touched ? targetText : asText(suggestion);

  return (
    <form action={action} className="space-y-4">
      <fieldset>
        <legend className="label">¿Cuántos meses querés tener cubiertos?</legend>
        <div className="flex flex-wrap gap-2">
          {EMERGENCY_MONTH_OPTIONS.map((m) => (
            <label key={m} className="chip cursor-pointer">
              <input type="radio" name="months" value={m} checked={months === m} onChange={() => setMonths(m)} className="sr-only" />
              {m} meses
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">Lo habitual es entre 3 y 6 meses. Con ingresos variables, más.</p>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="currency">Moneda</label>
          <select
            className="input"
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value === "USD" ? "USD" : "ARS")}
            disabled={lockedCurrency !== null}
          >
            <option value="ARS">Pesos</option>
            <option value="USD">Dólares</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="usd_rate">Cotización US$</label>
          <input
            className="input"
            id="usd_rate"
            name="usd_rate"
            inputMode="decimal"
            placeholder={currency === "USD" ? "Ej: 1200" : "Solo si es en US$"}
            value={rateText}
            onChange={(e) => setRateText(e.target.value)}
            required={currency === "USD"}
          />
        </div>
      </div>
      {lockedCurrency && <p className="-mt-2 text-xs text-muted">La moneda queda fija una vez creado el fondo.</p>}

      <div>
        <label className="label" htmlFor="target_amount">Meta</label>
        <input
          className="input text-xl font-semibold"
          id="target_amount"
          name="target_amount"
          inputMode="decimal"
          placeholder="0"
          value={shownTarget}
          onChange={(e) => {
            setTouched(true);
            setTargetText(e.target.value);
          }}
          required
        />
        {suggestion !== null && suggestion > 0 && (
          <p className="mt-1 text-xs text-muted">
            Sugerido: {formatMoney(suggestion, currency)} ({months} × {formatMoney(monthlyArs)} de gastos esenciales
            {currency === "USD" ? " pasados a dólares" : ""}).{" "}
            {touched && asText(suggestion) !== targetText && (
              <button
                type="button"
                className="text-accent underline"
                onClick={() => {
                  setTargetText(asText(suggestion));
                  setTouched(false);
                }}
              >
                Usar el sugerido
              </button>
            )}
          </p>
        )}
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>
        {lockedCurrency ? "Guardar cambios" : "Armar el fondo"}
      </button>
    </form>
  );
}

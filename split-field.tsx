"use client";

import { useState } from "react";
import { equalShares, formatPct } from "@/lib/split";
import { formatMoney } from "@/lib/format";
import type { Member, Shares } from "@/lib/types";

type Props = {
  members: Member[];
  defaultShares: Shares;
  /** Importe cargado, para mostrar cuánto le toca a cada uno. */
  amount: number | null;
};

/** Reparto de un gasto compartido. Por defecto partes iguales; "Cambiar" permite poner otros %. */
export function SplitField({ members, defaultShares, amount }: Props) {
  const [shares, setShares] = useState<Record<string, number>>(() =>
    defaultShares
      ? Object.fromEntries(members.map((m) => [m.id, Number(defaultShares[m.id] ?? 0)]))
      : equalShares(members),
  );
  const [editing, setEditing] = useState(Boolean(defaultShares));
  const values = Object.values(shares);
  const isEqual = values.every((v) => Math.abs(v - values[0]) < 0.01);
  const total = values.reduce((s, v) => s + v, 0);

  function change(id: string, raw: string) {
    const value = Math.min(100, Math.max(0, Number(raw.replace(",", ".")) || 0));
    if (members.length === 2) {
      const other = members.find((m) => m.id !== id)!;
      setShares({ [id]: value, [other.id]: Math.round((100 - value) * 100) / 100 });
    } else {
      setShares({ ...shares, [id]: value });
    }
  }

  if (members.length < 2) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <input type="hidden" name="shares" value={isEqual ? "" : JSON.stringify(shares)} />
      <div className="flex items-center justify-between">
        <span className="label mb-0">Reparto</span>
        {editing ? (
          <button type="button" className="text-sm text-accent" onClick={() => { setShares(equalShares(members)); setEditing(false); }}>
            Volver a partes iguales
          </button>
        ) : (
          <button type="button" className="text-sm text-accent" onClick={() => setEditing(true)}>
            Cambiar %
          </button>
        )}
      </div>
      <ul className="space-y-1.5 text-sm">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2">
            <span className="font-medium">{m.name}</span>
            <span className="flex items-center gap-2 tabular-nums">
              {amount ? <span className="text-muted">{formatMoney((amount * (shares[m.id] ?? 0)) / 100)}</span> : null}
              {editing ? (
                <span className="flex items-center gap-1">
                  <input
                    className="input w-20 py-1 text-right"
                    inputMode="decimal"
                    aria-label={`Porcentaje de ${m.name}`}
                    value={formatPct(shares[m.id] ?? 0)}
                    onChange={(e) => change(m.id, e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                  %
                </span>
              ) : (
                <span>{formatPct(shares[m.id] ?? 0)}%</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {editing && Math.abs(total - 100) > 0.5 && (
        <p className="text-xs text-danger">Tiene que sumar 100% (ahora suma {formatPct(Math.round(total * 100) / 100)}%).</p>
      )}
    </div>
  );
}

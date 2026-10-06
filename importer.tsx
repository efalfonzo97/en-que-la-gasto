"use client";

import { useState, useTransition } from "react";
import readXlsxFile from "read-excel-file/browser";
import { parseCuentasSheet, type ImportResult } from "@/lib/import";
import { formatMoney } from "@/lib/format";
import { importRows, type ImportState } from "./actions";

export function Importer() {
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [state, setState] = useState<ImportState>({});
  const [pending, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    setState({});
    setPreview(null);
    if (!file) return;
    try {
      const sheets = await readXlsxFile(file);
      const sheet = sheets.find((s) => s.sheet.toLowerCase() === "cuentas") ?? sheets[0];
      setPreview(parseCuentasSheet(sheet.data));
    } catch {
      setState({ error: "No pude leer el archivo. ¿Es un Excel (.xlsx o .xlsm)?" });
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".xlsx,.xlsm"
        className="input"
        onChange={(e) => onFile(e.target.files?.[0])}
        aria-label="Archivo de Excel"
      />

      {preview && !state.done && (
        <div className="space-y-3">
          <div className="card space-y-2">
            <h2 className="font-semibold">{preview.transactions.length} movimientos (filas con fecha)</h2>
            <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
              {preview.transactions.map((t, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">{t.date.slice(5)} · {t.description} <span className="text-muted">({t.category})</span></span>
                  <span className="tabular-nums">{formatMoney(t.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card space-y-2">
            <h2 className="font-semibold">{preview.fixed.length} gastos fijos (filas sin fecha)</h2>
            <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
              {preview.fixed.map((f, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">{f.description} <span className="text-muted">({f.category})</span></span>
                  <span className="tabular-nums">{f.amount ? formatMoney(f.amount) : "—"}</span>
                </li>
              ))}
            </ul>
          </div>
          {preview.skipped.length > 0 && (
            <ul className="text-sm text-muted">
              {preview.skipped.map((s, i) => <li key={i}>No se importa: {s}</li>)}
            </ul>
          )}
          <button
            className="btn w-full"
            disabled={pending}
            onClick={() => startTransition(async () => setState(await importRows(preview)))}
          >
            {pending ? "Importando…" : "Importar"}
          </button>
        </div>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.done && <p className="rounded-xl bg-accent-soft p-3 text-sm">{state.done}</p>}
    </div>
  );
}

import Link from "next/link";
import { getContext } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { ESSENTIAL_LOOKBACK_MONTHS, formatMonths } from "@/lib/emergency";
import { loadEmergency } from "@/lib/emergency-data";
import { Gauge } from "@/components/gauge";
import { EmergencyForm } from "@/components/emergency-form";

export default async function EmergencyPage({ searchParams }: PageProps<"/emergencia">) {
  const params = await searchParams;
  const ctx = await getContext();
  const { ready, fund, project, progress, estimate, covered } = await loadEmergency(ctx);
  const essentialNames = ctx.categories.filter((c) => c.kind === "egreso" && c.essential && !c.archived);
  const months = fund?.months ?? 6;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🛟 Fondo de emergencia</h1>
        <p className="text-sm text-muted">
          Plata apartada para seguir pagando lo esencial si se corta un ingreso o aparece un imprevisto.
        </p>
      </div>
      {params.guardado && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm">Fondo guardado ✓</p>}

      {!ready && (
        <p className="card text-sm">
          Falta un paso en Supabase: correr <code>supabase/migrations/0005_presupuestos_emergencia.sql</code> (está en el README).
        </p>
      )}

      {fund && project && progress && (
        <section className="card space-y-3">
          <Gauge
            pct={covered === null ? null : (covered / months) * 100}
            color="#3b82f6"
            label={covered === null ? "Meses cubiertos: sin calcular" : `Cubre ${formatMonths(covered)} de ${months} meses`}
            detail={`${formatMoney(progress.total, project.currency)} de ${formatMoney(project.target_amount, project.currency)}`}
          />
          {covered === null && (
            <p className="text-xs text-muted">
              {estimate.monthly <= 0
                ? "Para calcular los meses hace falta saber cuánto gastan en lo esencial."
                : "Poné la cotización del dólar abajo para calcular los meses."}
            </p>
          )}
          <Link href={`/proyectos/${project.id}`} className="btn w-full">Cargar aporte</Link>
        </section>
      )}

      <section className="card space-y-2">
        <h2 className="font-semibold">Gasto esencial por mes</h2>
        {estimate.source === "ninguno" ? (
          <p className="text-sm text-muted">
            Todavía no hay gastos en categorías esenciales. Cargá algunos movimientos o marcá qué categorías son esenciales en{" "}
            <Link href="/config" className="text-accent">Ajustes</Link>.
          </p>
        ) : (
          <>
            <p className="text-2xl font-bold tabular-nums">{formatMoney(estimate.monthly)}</p>
            <p className="text-xs text-muted">
              {estimate.source === "promedio"
                ? `Promedio de ${estimate.monthsUsed === 1 ? "el último mes" : `los últimos ${estimate.monthsUsed} meses`} con gastos cargados (se miran hasta ${ESSENTIAL_LOOKBACK_MONTHS}).`
                : "Todavía no hay meses completos cargados: se usan los gastos fijos esenciales."}
            </p>
            <ul className="divide-y divide-border text-sm">
              {estimate.byCategory.map((r) => (
                <li key={r.category.id} className="flex justify-between gap-2 py-1.5">
                  <span className="truncate">{r.category.emoji} {r.category.name}</span>
                  <span className="tabular-nums">{formatMoney(r.monthly)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="text-xs text-muted">
          Esenciales: {essentialNames.map((c) => `${c.emoji} ${c.name}`).join(", ") || "ninguna"}. Se cambian en{" "}
          <Link href="/config" className="text-accent">Ajustes › Categorías</Link>.
        </p>
      </section>

      {ready && (
        <section className="card space-y-3">
          <h2 className="font-semibold">{project ? "Meta" : "Armar el fondo"}</h2>
          {!project && (
            <p className="text-sm text-muted">
              Se crea un proyecto compartido &quot;Fondo de emergencia&quot;. Los aportes se cargan ahí y cuentan como ahorro del mes.
            </p>
          )}
          <EmergencyForm
            monthlyArs={estimate.monthly}
            months={months}
            lockedCurrency={project?.currency ?? null}
            usdRate={fund?.usd_rate ?? null}
            target={project?.target_amount ?? null}
          />
        </section>
      )}
    </div>
  );
}

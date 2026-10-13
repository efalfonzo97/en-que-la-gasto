import Link from "next/link";
import { getContext } from "@/lib/data";
import { currentMonth, formatCompact, formatMoney, isMonth } from "@/lib/format";
import { fixedStatus, getContributions, getFixedExpenses, getMonthTransactions, getProjects } from "@/lib/queries";
import { projectProgress } from "@/lib/projects";
import { monthSummary } from "@/lib/summary";
import { getView, withQuery } from "@/lib/view";
import { MonthPicker } from "@/components/month-picker";
import { ViewToggle } from "@/components/view-toggle";
import { Donut } from "@/components/donut";
import { Gauge } from "@/components/gauge";

const FLOW_COLORS = { gastos: "#f2444f", pendientes: "#f5a524", ahorros: "#3b82f6", disponible: "#2ea89a" };
const MEMBER_COLORS = ["#2ea89a", "#8b5cf6", "#f5a524"];
const PROJECT_COLORS = ["#3b82f6", "#8b5cf6", "#2ea89a", "#f5a524"];
const MAX_HOME_PROJECTS = 4;

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const month = isMonth(params.mes) ? params.mes : currentMonth();
  const view = await getView(params.vista);
  const ctx = await getContext();
  const [transactions, fixed, allProjects] = await Promise.all([
    getMonthTransactions(ctx, month),
    getFixedExpenses(ctx),
    getProjects(ctx),
  ]);
  const personal = view === "yo";

  // Proyectos activos (en "solo lo mío", los compartidos y los propios).
  const projects = allProjects.filter((p) => !p.archived && (!personal || !p.for_member || p.for_member === ctx.me.id));
  const contributions = projects.length ? await getContributions(ctx, projects.map((p) => p.id)) : [];
  const projectRows = projects.map((p) => ({ project: p, progress: projectProgress(p, contributions, ctx.members) }));
  const s = monthSummary(transactions, fixedStatus(fixed, transactions), ctx.members, ctx.categories, personal ? ctx.me.id : null);
  const mine = s.perMember.find((p) => p.member.id === ctx.me.id);

  // Torta del inicio: a dónde fueron los ingresos del mes.
  // Cada fila lleva a Movimientos con ese detalle, en el mismo mes y la misma vista.
  const detail = (q: Record<string, string>) =>
    withQuery("/movimientos", { p: "mes", f: `${month}-01`, vista: view, ...q });
  const incomeHref = detail({ t: "ingresos", lista: "1" });
  const flow: { id: string; label: string; total: number; shown?: number; color: string; href: string }[] = [
    { id: "gastos", label: "Gastos", total: s.spent, color: FLOW_COLORS.gastos, href: detail({ estado: "pagado" }) },
    { id: "pendientes", label: "Pendientes", total: s.pending, color: FLOW_COLORS.pendientes, href: detail({ t: "todos", estado: "pendiente", fijos: "1" }) },
    { id: "ahorros", label: "Ahorros", total: s.saved, color: FLOW_COLORS.ahorros, href: detail({ t: "ahorros", lista: "1" }) },
    { id: "disponible", label: "Libre tras pendientes", total: Math.max(s.afterPending, 0), shown: s.afterPending, color: FLOW_COLORS.disponible, href: detail({ t: "todos" }) },
  ];
  const fixedHref = withQuery("/movimientos", { mes: month, fijos: "1" }) + "#fijos";
  const flowTotal = flow.reduce((sum, f) => sum + f.total, 0);

  // Aportes a lo compartido, con el usuario que inició sesión primero.
  const sharedRows = [...s.perMember]
    .sort((a, b) => Number(b.member.id === ctx.me.id) - Number(a.member.id === ctx.me.id))
    .map((p, i) => ({
      ...p,
      isMe: p.member.id === ctx.me.id,
      pct: s.sharedTotal ? (p.contributed / s.sharedTotal) * 100 : 0,
      color: MEMBER_COLORS[i % MEMBER_COLORS.length],
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{ctx.me.name}</h1>
          <p className="text-sm text-muted">{personal ? "Viendo solo lo tuyo" : `Viendo todo ${ctx.household.name}`}</p>
        </div>
        <ViewToggle view={view} path="/" query={{ mes: params.mes ? month : null }} variant="iconos" />
      </div>
      {params.cargado && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm">Movimiento guardado ✓</p>}
      <MonthPicker month={month} basePath="/" />

      <section className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted">Total disponible</p>
            <p className={`text-3xl font-bold tabular-nums ${s.available < 0 ? "text-danger" : ""}`}>
              {formatMoney(s.available)}
            </p>
            {s.pending > 0 && (
              <p className="text-sm text-muted">
                Después de pagar los pendientes:{" "}
                <span className={`font-semibold tabular-nums ${s.afterPending < 0 ? "text-danger" : "text-foreground"}`}>
                  {formatMoney(s.afterPending)}
                </span>
              </p>
            )}
          </div>
          <Link href={withQuery("/movimientos", { mes: month })} className="btn-ghost shrink-0 px-3 py-1.5 text-sm">
            Movimientos ›
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[auto_minmax(0,1fr)]">
          <Donut
            size="lg"
            slices={flow.map((f) => ({ id: f.id, total: f.total, color: f.color }))}
            total={flowTotal}
            center={formatCompact(s.income)}
            caption="ingresos"
          />
          <ul className="w-full min-w-0 divide-y divide-border text-sm">
            <li>
              <Link href={incomeHref} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 font-medium">Ingresos</span>
                <span className="font-semibold tabular-nums text-income">{formatMoney(s.income)}</span>
                <span className="text-muted" aria-hidden>›</span>
              </Link>
            </li>
            {flow.map((f) => (
              <li key={f.id}>
                <Link href={f.href} className="flex items-center gap-2 py-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{f.label}</span>
                  <span className={`tabular-nums ${(f.shown ?? f.total) < 0 ? "text-danger" : ""}`}>
                    {formatMoney(f.shown ?? f.total)}
                  </span>
                  <span className="text-muted" aria-hidden>›</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {s.hasUsd && <p className="text-xs text-muted">Los movimientos en dólares no entran en estos totales.</p>}
      </section>

      {ctx.members.length > 1 && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Tu parte de lo compartido</h2>
          {s.sharedTotal === 0 ? (
            <p className="text-sm text-muted">Todavía no hay gastos compartidos este mes.</p>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[auto_minmax(0,1fr)]">
                <Donut
                  size="sm"
                  slices={sharedRows.map((r) => ({ id: r.member.id, total: r.contributed, color: r.color }))}
                  total={s.sharedTotal}
                  caption="compartido"
                />
                <ul className="w-full min-w-0 space-y-2 text-sm">
                  {sharedRows.map((r) => (
                    <li key={r.member.id} className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-medium">{r.isMe ? `Vos (${r.member.name})` : r.member.name}</span>
                        <span className="tabular-nums text-muted">{Math.round(r.pct)}%</span>
                      </div>
                      <p className="pl-4.5 tabular-nums">{formatMoney(r.contributed)}</p>
                    </li>
                  ))}
                </ul>
              </div>
              {mine && (
                <p className="border-t border-border pt-2 text-sm text-muted">
                  Pusiste {formatMoney(mine.contributed)} y te correspondía {formatMoney(mine.share)}.{" "}
                  {Math.abs(mine.balance) < 1
                    ? "Están a mano."
                    : mine.balance > 0
                      ? `Tenés ${formatMoney(mine.balance)} a favor.`
                      : `Te faltan poner ${formatMoney(-mine.balance)}.`}
                </p>
              )}
            </>
          )}
        </section>
      )}

      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Proyectos</h2>
          <Link href="/proyectos" className="btn-ghost shrink-0 px-3 py-1.5 text-sm">
            Proyectos ›
          </Link>
        </div>
        {projectRows.length === 0 ? (
          <p className="text-sm text-muted">
            Todavía no hay proyectos.{" "}
            <Link href="/proyectos/nuevo" className="text-accent">Crear uno</Link>
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-4">
              {projectRows.slice(0, MAX_HOME_PROJECTS).map(({ project: p, progress }, i) => (
                <li key={p.id} className="min-w-0">
                  <Link href={`/proyectos/${p.id}`} className="block">
                    <Gauge
                      size="xs"
                      pct={progress.pct}
                      color={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                      label={p.title}
                      detail={`${formatMoney(progress.total, p.currency)} de ${formatMoney(p.target_amount, p.currency)}`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
            {projectRows.length > MAX_HOME_PROJECTS && (
              <p className="text-xs text-muted">Y {projectRows.length - MAX_HOME_PROJECTS} más en la sección Proyectos.</p>
            )}
          </>
        )}
      </section>

      <details className="card group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="font-semibold">Pendientes</span>
          <span className="flex items-center gap-2 text-sm">
            <span className="tabular-nums text-muted">
              {s.upcoming.length === 0 ? "Nada pendiente" : `${s.upcoming.length} · ${formatMoney(s.pending)}`}
            </span>
            <span className="text-accent group-open:hidden">Mostrar</span>
            <span className="hidden text-accent group-open:inline">Ocultar</span>
          </span>
        </summary>
        <div className="mt-3 space-y-3">
          {s.upcoming.length === 0 ? (
            <p className="text-sm text-muted">No queda nada pendiente este mes.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.upcoming.map((u) => (
                <li key={u.id}>
                  <Link href={u.kind === "fijo" ? fixedHref : u.href} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0 truncate">
                      {u.day ? <span className="text-muted">{u.day} · </span> : null}
                      {u.description}
                      <span className="text-xs text-muted">{u.kind === "fijo" ? " · fijo" : ""}</span>
                    </span>
                    <span className="tabular-nums">{formatMoney(u.amount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={fixedHref} className="block text-sm text-accent">
            Ver fijos del mes
          </Link>
        </div>
      </details>
    </div>
  );
}

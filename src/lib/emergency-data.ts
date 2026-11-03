import type { AppContext } from "@/lib/data";
import { currentMonth, monthRange, shiftMonth } from "@/lib/format";
import { ESSENTIAL_LOOKBACK_MONTHS, essentialEstimate, monthsCovered } from "@/lib/emergency";
import { projectProgress } from "@/lib/projects";
import { getContributions, getEmergencyFund, getFixedExpenses, getProject, getRangeTransactions } from "@/lib/queries";

/** Todo lo que hace falta para mostrar el fondo de emergencia. */
export async function loadEmergency(ctx: AppContext) {
  const month = currentMonth();
  const start = monthRange(shiftMonth(month, -ESSENTIAL_LOOKBACK_MONTHS)).start;
  const [{ ready, fund }, past, fixed] = await Promise.all([
    getEmergencyFund(ctx),
    getRangeTransactions(ctx, start, monthRange(month).start),
    getFixedExpenses(ctx),
  ]);
  const estimate = essentialEstimate(past, ctx.categories, fixed);
  const project = fund?.project_id ? await getProject(ctx, fund.project_id) : null;
  const progress = project ? projectProgress(project, await getContributions(ctx, [project.id]), ctx.members) : null;
  const covered = fund && project && progress ? monthsCovered(progress.total, project, fund, estimate.monthly) : null;
  return { ready, fund, project, progress, estimate, covered, past };
}

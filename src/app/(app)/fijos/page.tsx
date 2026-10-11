import { redirect } from "next/navigation";
import { isMonth } from "@/lib/format";
import { withQuery } from "@/lib/view";

/** Los fijos ahora viven dentro de Movimientos. */
export default async function FixedPage({ searchParams }: PageProps<"/fijos">) {
  const params = await searchParams;
  redirect(withQuery("/movimientos", { mes: isMonth(params.mes) ? params.mes : null, fijos: "1" }) + "#fijos");
}

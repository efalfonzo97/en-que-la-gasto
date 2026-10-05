import { getContext } from "@/lib/data";
import { BottomNav } from "./nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await getContext();
  return (
    <>
      <main className="mx-auto max-w-lg px-4 pt-6 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}

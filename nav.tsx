"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/movimientos", label: "Movimientos", icon: "📋" },
  { href: "/cargar", label: "Cargar", icon: "➕", primary: true },
  { href: "/fijos", label: "Fijos", icon: "📅" },
  { href: "/config", label: "Ajustes", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${active ? "font-semibold text-accent" : "text-muted"}`}
              >
                <span
                  className={
                    item.primary
                      ? "-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl shadow-lg"
                      : "text-xl"
                  }
                  aria-hidden
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import { CalendarRange, ClipboardList, LayoutDashboard, Mail, SquareCheckBig } from "lucide-react";

const items: Array<{
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    href: "/coordenacao",
    label: "Visão geral",
    icon: LayoutDashboard
  },
  {
    href: "/coordenacao/solicitacoes",
    label: "Solicitações",
    icon: ClipboardList
  },
  {
    href: "/coordenacao/aprovados",
    label: "Aprovados",
    icon: SquareCheckBig
  },
  {
    href: "/coordenacao/disponibilidade",
    label: "Disponibilidade",
    icon: CalendarRange
  },
  {
    href: "/coordenacao/configuracoes",
    label: "Configurações",
    icon: Mail
  }
];

export function CoordinatorNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex flex-wrap gap-1.5">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-brand-600 text-white shadow-ambient"
                : "border border-white/60 bg-white/90 text-slate-700 hover:bg-slate-100"
            }`}
            href={item.href}
            key={item.href}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

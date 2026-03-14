"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  Mail,
  Package,
  Sparkles,
  SquareCheckBig
} from "lucide-react";

import type { AuthenticatedSession } from "@/types";
import { getRoleLabel, getPanelLabel } from "@/lib/utils/role-labels";
import { LabifLogo } from "@/components/layout/labif-logo";
import { Badge } from "@/components/ui/badge";

interface ProtectedSidebarProps {
  session: AuthenticatedSession;
}

interface NavItem {
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getNavigation(session: AuthenticatedSession): NavGroup[] {
  const base: NavGroup[] = [
    {
      label: "Principal",
      items: [
        {
          href: "/app",
          label: getPanelLabel(session.papel),
          icon: LayoutDashboard
        }
      ]
    }
  ];

  if (session.papel === "coordenador") {
    base.push({
      label: "Coordenação",
      items: [
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
          href: "/coordenacao/equipamentos",
          label: "Equipamentos",
          icon: Package
        },
        {
          href: "/coordenacao/configuracoes",
          label: "Configurações",
          icon: Mail
        }
      ]
    });
  }

  base.push({
    label: "Portal",
    items: [
      {
        href: "/",
        label: "Página inicial",
        icon: Sparkles
      }
    ]
  });

  return base;
}

function isActive(pathname: string, href: Route) {
  if (href === "/coordenacao") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProtectedSidebar({ session }: ProtectedSidebarProps) {
  const pathname = usePathname();
  const groups = getNavigation(session);

  return (
    <>
      <div className="mb-4 rounded-[24px] border border-slate-200/70 bg-[linear-gradient(180deg,#173c26_0%,#1f4d2f_100%)] px-4 py-4 text-white shadow-ambient lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <LabifLogo className="[&_p]:text-white/80 [&_.font-display]:text-white" compact />
          <Badge variant={session.papel === "coordenador" ? "brand" : "neutral"}>
            {getRoleLabel(session.papel)}
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {group.label}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "border border-white/10 bg-white/5 text-slate-300"
                      }`}
                      href={item.href}
                      key={item.href}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[272px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-emerald-950/60 bg-[linear-gradient(180deg,#163423_0%,#1f4d2f_100%)] text-white shadow-ambient lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <LabifLogo className="[&_p]:text-white/70 [&_.font-display]:text-white" compact />
          <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 px-3 py-3">
            <p className="text-sm font-medium text-white">{session.nome}</p>
            <p className="mt-1 text-xs text-slate-400">{session.email}</p>
            <Badge className="mt-3" variant={session.papel === "coordenador" ? "brand" : "neutral"}>
              {getRoleLabel(session.papel)}
            </Badge>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      className={`flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                          : "text-slate-300 hover:bg-white/6 hover:text-white"
                      }`}
                      href={item.href}
                      key={item.href}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

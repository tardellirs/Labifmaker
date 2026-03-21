import Link from "next/link";
import type { Route } from "next";
import type { ComponentType } from "react";
import { BarChart3, CalendarRange, ClipboardList, Mail, Package, SquareCheckBig } from "lucide-react";

import { BookingCalendar } from "@/components/coordinator/booking-calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireCoordinator } from "@/lib/auth/guards";
import { getCoordinatorDashboardData } from "@/lib/coordinator/dashboard-data";

export default async function CoordinatorOverviewPage() {
  const [session, { bookings, metrics }] = await Promise.all([
    requireCoordinator(),
    getCoordinatorDashboardData()
  ]);

  const stats = [
    {
      label: "Pendentes",
      value: String(metrics.pendingCount).padStart(2, "0"),
      href: "/coordenacao/solicitacoes" as const
    },
    {
      label: "Aprovados",
      value: String(metrics.approvedCount).padStart(2, "0"),
      href: "/coordenacao/aprovados" as const
    },
    {
      label: "Finalizados",
      value: String(metrics.finalizedCount).padStart(2, "0")
    }
  ];

  const quickLinks: Array<{
    href: Route;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    value: string;
  }> = [
    {
      href: "/coordenacao/solicitacoes",
      title: "Fila de solicitações",
      description: "Avalie pedidos pendentes com comentário e decisão.",
      icon: ClipboardList,
      value: String(metrics.pendingCount).padStart(2, "0")
    },
    {
      href: "/coordenacao/aprovados",
      title: "Histórico aprovado",
      description: "Consulte os agendamentos confirmados e seus detalhes técnicos.",
      icon: SquareCheckBig,
      value: String(metrics.approvedCount).padStart(2, "0")
    },
    {
      href: "/coordenacao/disponibilidade",
      title: "Disponibilidade",
      description: "Publique janelas de uso para o laboratório.",
      icon: CalendarRange,
      value: String(metrics.operationalCount).padStart(2, "0")
    },
    {
      href: "/coordenacao/equipamentos",
      title: "Equipamentos",
      description: "Cadastre, remova e controle a disponibilidade das máquinas.",
      icon: Package,
      value: String(metrics.operationalCount).padStart(2, "0")
    },
    {
      href: "/coordenacao/configuracoes",
      title: "Notificações",
      description: "Gerencie coordenadores e quem recebe e-mails do sistema.",
      icon: Mail,
      value: String(metrics.notificationRecipientsCount).padStart(2, "0")
    }
  ];

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-1.5 px-1 py-1">
          <Badge variant="brand">Área do coordenador</Badge>
          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Bem-vindo, Coord. {session.nome.split(" ")[0]}.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Acompanhe o fluxo do laboratório: aprove solicitações, defina janelas de horário e administre os equipamentos disponíveis para a comunidade.
          </p>
        </div>

        <Card className="bg-[linear-gradient(180deg,#163423_0%,#1f4d2f_100%)] text-white">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-300" />
            <CardTitle className="text-white">Indicadores</CardTitle>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {stats.map((item) =>
              item.href ? (
                <Link
                  className="rounded-xl bg-white/10 px-3 py-2 transition hover:bg-white/15 hover:text-brand-100"
                  href={item.href}
                  key={item.label}
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand-100">Abrir fila</p>
                </Link>
              ) : (
                <div className="rounded-xl bg-white/10 px-3 py-2" key={item.label}>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
                </div>
              )
            )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {quickLinks.map((item) => (
          <Link href={item.href} key={item.href}>
            <Card className="h-full px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/40">
              <div className="flex items-center justify-between gap-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <p className="truncate text-xs font-semibold text-slate-950">{item.title}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-400">{item.value}</span>
              </div>
              <CardDescription className="mt-1 text-xs leading-4">{item.description}</CardDescription>
            </Card>
          </Link>
        ))}
      </section>

      <BookingCalendar bookings={bookings} />
    </div>
  );
}

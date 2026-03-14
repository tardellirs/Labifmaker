import { BellDot, PanelLeftOpen } from "lucide-react";

import type { AuthenticatedSession } from "@/types";
import { getRoleLabel } from "@/lib/utils/role-labels";
import { Badge } from "@/components/ui/badge";
import { ProtectedSidebar } from "@/components/layout/protected-sidebar";
import { UserMenu } from "@/components/layout/user-menu";

interface ProtectedShellProps {
  session: AuthenticatedSession;
  children: React.ReactNode;
}

export function ProtectedShell({ session, children }: ProtectedShellProps) {
  return (
    <div className="min-h-screen bg-[#f3f7f1]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-3 py-3 sm:px-4">
        <ProtectedSidebar session={session} />

        <div className="min-w-0 flex-1">
          <header className="mb-4 rounded-[24px] border border-white/70 bg-white/90 px-4 py-3 shadow-ambient backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 lg:flex">
                  <PanelLeftOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    LabIF Maker Jacarei
                  </p>
                  <h1 className="font-display text-xl font-semibold text-slate-950">
                    Portal de agendamentos
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <div className="inline-flex items-center justify-center rounded-full bg-brand-50 p-2 text-brand-700">
                  <BellDot className="h-4 w-4 text-brand-600" />
                </div>
                <Badge variant={session.papel === "coordenador" ? "brand" : "neutral"}>
                  {getRoleLabel(session.papel)}
                </Badge>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-slate-900">{session.nome}</p>
                  <p className="text-xs text-slate-500">{session.email}</p>
                </div>
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

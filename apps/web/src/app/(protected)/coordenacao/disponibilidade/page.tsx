import { CalendarRange } from "lucide-react";

import { AvailabilityManager } from "@/components/coordinator/availability-manager";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCoordinatorDashboardData } from "@/lib/coordinator/dashboard-data";

export default async function CoordinatorAvailabilityPage() {
  const { availabilitySlots } = await getCoordinatorDashboardData();

  return (
    <div className="space-y-6">
      <Card className="bg-[linear-gradient(180deg,#163423_0%,#1f4d2f_100%)] text-white">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-6 w-6 text-brand-300" />
          <div>
            <CardTitle className="text-white">Disponibilidade do laboratorio</CardTitle>
            <CardDescription className="mt-2 text-slate-300">
              Publique e ajuste janelas de atendimento para que os professores escolham horarios
              dentro dos intervalos autorizados.
            </CardDescription>
          </div>
        </div>
      </Card>

      <AvailabilityManager slots={availabilitySlots} />
    </div>
  );
}

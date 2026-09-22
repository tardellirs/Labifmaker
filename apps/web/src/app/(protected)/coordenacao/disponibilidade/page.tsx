import { CalendarRange } from "lucide-react";

import { OperatingHoursManager } from "@/components/coordinator/operating-hours-manager";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getOperatingHours } from "@/lib/availability/store";

export default async function CoordinatorAvailabilityPage() {
  const operatingHours = await getOperatingHours();

  return (
    <div className="space-y-6">
      <Card className="bg-[linear-gradient(180deg,#163423_0%,#1f4d2f_100%)] text-white">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-6 w-6 text-brand-300" />
          <div>
            <CardTitle className="text-white">Disponibilidade do laboratorio</CardTitle>
            <CardDescription className="mt-2 text-slate-300">
              Defina o horario de funcionamento uma vez e ele vale para todas as semanas.
            </CardDescription>
          </div>
        </div>
      </Card>

      <OperatingHoursManager
        atualizadoPorNome={operatingHours.atualizadoPorNome}
        semana={operatingHours.semana}
      />
    </div>
  );
}

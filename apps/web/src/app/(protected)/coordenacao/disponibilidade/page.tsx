import { CalendarRange } from "lucide-react";

import { AvailabilityManager } from "@/components/coordinator/availability-manager";
import { OperatingHoursManager } from "@/components/coordinator/operating-hours-manager";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getOperatingHours } from "@/lib/availability/store";
import { getCoordinatorAvailabilityData } from "@/lib/coordinator/dashboard-data";

export default async function CoordinatorAvailabilityPage() {
  const [operatingHours, availabilitySlots] = await Promise.all([
    getOperatingHours(),
    getCoordinatorAvailabilityData()
  ]);

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

      {availabilitySlots.length > 0 ? (
        <div className="space-y-3">
          <Card className="border-amber-200 bg-amber-50">
            <CardTitle className="text-base text-amber-900">
              Horarios publicados no modelo antigo
            </CardTitle>
            <CardDescription className="mt-2 text-amber-800">
              Estes horarios foram publicados data a data e ainda sao o que os professores
              enxergam hoje. Assim que o novo calendario entrar no ar, esta secao sai do painel.
              Ate la, nao e preciso continuar publicando aqui.
            </CardDescription>
          </Card>

          <AvailabilityManager slots={availabilitySlots} />
        </div>
      ) : null}
    </div>
  );
}

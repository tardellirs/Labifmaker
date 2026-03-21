import { Package } from "lucide-react";

import { EquipmentManager } from "@/components/coordinator/equipment-manager";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getEquipmentCatalog } from "@/lib/equipment/catalog";

export default async function CoordinatorEquipmentPage() {
  const equipmentCatalog = await getEquipmentCatalog();

  return (
    <div className="space-y-6">
      <Card className="bg-[linear-gradient(180deg,#163423_0%,#1f4d2f_100%)] text-white">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-brand-300" />
          <div>
            <CardTitle className="text-white">Equipamentos do laboratório</CardTitle>
            <CardDescription className="mt-2 text-slate-300">
              Cadastre, remova e controle a disponibilidade dos equipamentos exibidos no portal.
            </CardDescription>
          </div>
        </div>
      </Card>

      <EquipmentManager equipmentCatalog={equipmentCatalog} />
    </div>
  );
}

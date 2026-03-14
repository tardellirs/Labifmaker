import { Cog, Printer, Scissors } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const equipmentItems = [
  {
    icon: Printer,
    title: "Impressão 3D",
    desc: "Prototipagem rápida com solicitação guiada e janela liberada."
  },
  {
    icon: Scissors,
    title: "Corte a Laser",
    desc: "Controle de materiais permitidos e avaliação da coordenação antes da aprovação."
  },
  {
    icon: Cog,
    title: "Fresadora CNC",
    desc: "Solicitações técnicas com validação da coordenação e agenda institucional."
  }
];

export function LandingEquipment() {
  return (
    <section className="py-10 sm:py-14" id="equipamentos">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
            Equipamentos e recursos
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-emerald-700" />
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
          {equipmentItems.map((item) => (
            <Card
              className="border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              key={item.title}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <item.icon className="h-6 w-6 text-emerald-700" />
              </div>
              <CardTitle className="mt-4">{item.title}</CardTitle>
              <CardDescription className="mt-2">{item.desc}</CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

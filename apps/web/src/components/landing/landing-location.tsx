import { Clock3, MapPin, Phone } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function LandingLocation() {
  return (
    <section className="bg-slate-100/60 py-10 sm:py-14" id="localizacao">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
            Localização
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            O laboratório funciona no IFSP Campus Jacareí, com atendimento conforme as janelas
            publicadas e agenda institucional.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-[340px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <iframe
              allowFullScreen
              className="block h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=IFSP%20Campus%20Jacare%C3%AD%20Rua%20Ant%C3%B4nio%20Foga%C3%A7a%20de%20Almeida%2C%20200%20Jacare%C3%AD%20SP&z=17&output=embed"
              style={{ border: 0 }}
              title="Localização IFSP Jacareí"
            />
          </div>

          <div className="space-y-4 lg:grid lg:h-[340px] lg:grid-rows-3 lg:gap-4 lg:space-y-0">
            <Card className="border-slate-200 bg-white shadow-none lg:h-full">
              <div className="flex items-start gap-4 lg:h-full lg:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <MapPin className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <CardTitle>Endereço</CardTitle>
                  <CardDescription className="mt-2">
                    Rua Antônio Fogaça de Almeida, 200
                    <br />
                    Jardim Elza Maria
                    <br />
                    Jacareí/SP - CEP 12322-030
                  </CardDescription>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 bg-white shadow-none lg:h-full">
              <div className="flex items-start gap-4 lg:h-full lg:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <Clock3 className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <CardTitle>Atendimento</CardTitle>
                  <CardDescription className="mt-2">
                    As disponibilidades são publicadas pela coordenação dentro do sistema.
                    <br />
                    Consulte as janelas liberadas antes de enviar o pedido.
                  </CardDescription>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 bg-white shadow-none lg:h-full">
              <div className="flex items-start gap-4 lg:h-full lg:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <Phone className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <CardTitle>Contato</CardTitle>
                  <CardDescription className="mt-2">
                    labifmaker.jacarei@gmail.com
                    <br />
                    Coordenação e notificações do portal
                  </CardDescription>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

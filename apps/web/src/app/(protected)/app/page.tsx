import { CalendarClock, ChevronDown, FileStack, Wrench } from "lucide-react";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { toAvailabilitySlot, toBooking } from "@/lib/bookings/serializers";
import { formatDate, formatDetailLabel, formatDetailValue } from "@/lib/bookings/formatters";
import { getEquipmentCatalog } from "@/lib/equipment/catalog";
import { getAdminDb } from "@/lib/firebase/admin";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import { BookingCancelButton } from "@/components/booking/booking-cancel-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const PANEL_LABELS: Record<string, { badge: string; description: string }> = {
  professor: {
    badge: "Painel do Professor",
    description:
      "Solicite horários para uso dos equipamentos, acompanhe o status dos seus pedidos e consulte o histórico de agendamentos."
  },
  aluno: {
    badge: "Painel do Aluno",
    description:
      "Solicite horários para uso dos equipamentos, acompanhe o status dos seus pedidos e consulte o histórico de agendamentos."
  },
  externo: {
    badge: "Painel do Usuário",
    description:
      "Solicite horários para uso dos equipamentos, acompanhe o status dos seus pedidos e consulte o histórico de agendamentos."
  }
};

function getTrainingStatusByEquipment(session: Awaited<ReturnType<typeof requireAuthenticatedUser>>) {
  return {
    "impressora-3d": Boolean(session.profile?.treinamentos.impressora3d),
    "cortadora-laser": Boolean(session.profile?.treinamentos.laser),
    "fresadora-cnc": Boolean(session.profile?.treinamentos.cnc)
  };
}

export default async function ProfessorDashboardPage() {
  // start uid-independent fetches immediately, don't wait for session
  const equipmentPromise = getEquipmentCatalog();
  const availabilityPromise = getAdminDb().collection("disponibilidades").where("ativo", "==", true).get();

  const session = await requireAuthenticatedUser();

  const [equipmentCatalog, availabilitySnapshot, bookingsSnapshot] = await Promise.all([
    equipmentPromise,
    availabilityPromise,
    getAdminDb()
      .collection("agendamentos")
      .where("solicitanteUid", "==", session.uid)
      .get()
  ]);
  const availabilitySlots = availabilitySnapshot.docs.map((doc) =>
    toAvailabilitySlot(doc.id, doc.data())
  );
  const bookings = bookingsSnapshot.docs
    .map((doc) => toBooking(doc.id, doc.data()))
    .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0));

  const statusCards = [
    {
      title: "Pendentes",
      value: String(bookings.filter((booking) => booking.status === "pendente").length).padStart(2, "0")
    },
    {
      title: "Aprovados",
      value: String(bookings.filter((booking) => booking.status === "aprovado").length).padStart(2, "0")
    },
    {
      title: "Indeferidos",
      value: String(bookings.filter((booking) => booking.status === "rejeitado").length).padStart(2, "0")
    }
  ];

  const equipmentInMaintenance = equipmentCatalog.filter((equipment) => equipment.status === "manutencao");
  const trainingStatus = getTrainingStatusByEquipment(session);
  const panelLabel = PANEL_LABELS[session.papel] ?? PANEL_LABELS.professor;

  return (
    <div className="space-y-3">
      <section className="grid gap-2.5 lg:grid-cols-[1fr_1fr]">
        <Card className="overflow-hidden p-3">
          <Badge variant="brand">{panelLabel.badge}</Badge>
          <h1 className="mt-1.5 text-lg font-semibold text-slate-950 sm:text-xl">
            Olá, {session.nome.split(" ")[0]}!
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            {panelLabel.description}
          </p>
        </Card>

        <Card className="bg-[linear-gradient(180deg,#163423_0%,#1f4d2f_100%)] p-3 text-white">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand-300" />
            <CardTitle className="text-sm text-white">Minhas solicitações</CardTitle>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {statusCards.map((item) => (
              <div className="rounded-xl bg-white/10 px-3 py-2" key={item.title}>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.title}</p>
                <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <BookingRequestForm
        availabilitySlots={availabilitySlots}
        equipmentCatalog={equipmentCatalog}
        trainingStatus={trainingStatus}
      />

      <section className="grid gap-3 xl:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-brand-600" />
            <CardTitle>Disponibilidade das máquinas</CardTitle>
          </div>
          <div className="mt-4 space-y-2.5">
            {equipmentCatalog.map((equipment) => (
              <div
                className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-2.5"
                key={equipment.id}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{equipment.nome}</p>
                  <p className="text-xs text-slate-500">
                    {equipment.requerTreinamento ? "Treinamento recomendado" : "Acesso orientado"}
                  </p>
                </div>
                <Badge variant={equipment.status === "manutencao" ? "warm" : "success"}>
                  {equipment.status === "manutencao" ? "Indisponível" : "Disponível"}
                </Badge>
              </div>
            ))}
          </div>
          {equipmentInMaintenance.length === 0 ? (
            <CardDescription className="mt-4">
              Nenhuma máquina está bloqueada neste momento.
            </CardDescription>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <FileStack className="h-5 w-5 text-brand-600" />
            <CardTitle>Minhas solicitações</CardTitle>
          </div>
          <CardDescription className="mt-3">
            Histórico em tempo real dos pedidos enviados pelo portal.
          </CardDescription>

          <div className="mt-4 space-y-2.5">
            {bookings.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                Nenhum agendamento enviado ainda. Use o formulário acima para criar a primeira solicitação.
              </div>
            ) : (
              bookings.map((booking) => (
                <details
                  className="group rounded-[20px] border border-slate-200 bg-slate-50"
                  key={booking.id}
                >
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-base font-semibold text-slate-950">{booking.projeto}</p>
                          <Badge
                            variant={
                              booking.status === "aprovado"
                                ? "success"
                                : booking.status === "pendente"
                                  ? "warm"
                                  : booking.status === "cancelado"
                                    ? "danger"
                                    : "neutral"
                            }
                          >
                            {booking.status === "rejeitado" ? "indeferido" : booking.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600">{booking.equipamentoNome}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{formatDate(booking.dataSolicitada)} · {booking.horaInicio} - {booking.horaFim}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:-rotate-180" />
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-slate-200 px-4 py-4">
                    <p className="text-sm leading-6 text-slate-600">{booking.descricao}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {booking.sabeOperarEquipamento
                        ? "Informou que sabe utilizar o equipamento."
                        : "Informou que ainda precisa de apoio para utilizar o equipamento."}
                    </p>

                    {Object.keys(booking.detalhesTecnicos).length > 0 ? (
                      <div className="mt-3 rounded-[18px] border border-slate-200 bg-white p-4">
                        <p className="text-sm font-medium text-slate-900">Detalhes técnicos</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          {Object.entries(booking.detalhesTecnicos).map(([key, value]) => (
                            <div className="flex items-start justify-between gap-4" key={key}>
                              <span className="text-slate-500">{formatDetailLabel(key)}</span>
                              <span className="text-right text-slate-900">{formatDetailValue(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {booking.justificativa ? (
                      <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Comentário da coordenação: {booking.justificativa}
                      </div>
                    ) : null}

                    <div className="mt-4 flex justify-end">
                      <BookingCancelButton bookingId={booking.id} status={booking.status} />
                    </div>
                  </div>
                </details>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

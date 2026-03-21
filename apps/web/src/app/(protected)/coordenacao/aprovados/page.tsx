import { ApprovedBookingsArchive } from "@/components/coordinator/approved-bookings-archive";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getApprovedBookings } from "@/lib/coordinator/dashboard-data";

export default async function CoordinatorApprovedPage() {
  const bookings = await getApprovedBookings();
  const approvedCount = bookings.length;

  return (
    <div className="space-y-6">
      <Card>
        <Badge variant="brand">Aprovados</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
          Histórico aprovado com consulta detalhada.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Aqui ficam preservados os agendamentos confirmados no site, com detalhes técnicos,
          comentário da coordenação e link para o Google Calendar quando disponível. Total atual:
          {" "}
          {approvedCount}.
        </p>
      </Card>

      <ApprovedBookingsArchive bookings={bookings} />
    </div>
  );
}

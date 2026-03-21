import { BookingReviewQueue } from "@/components/coordinator/booking-review-queue";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPendingBookings } from "@/lib/coordinator/dashboard-data";

export default async function CoordinatorRequestsPage() {
  const bookings = await getPendingBookings();
  const pendingCount = bookings.length;

  return (
    <div className="space-y-6">
      <Card>
        <Badge variant="brand">Solicitações</Badge>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
          Fila operacional da coordenação.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Analise os pedidos pendentes, registre um comentário quando necessário e finalize a
          decisão sem sair desta página. Hoje há {pendingCount} pedido(s) aguardando retorno.
        </p>
      </Card>

      <BookingReviewQueue bookings={bookings} />
    </div>
  );
}

import "server-only";

import { getCoordinatorEmails, getNotificationRecipientEmails } from "@/lib/auth/access";
import { toAvailabilitySlot, toBooking } from "@/lib/bookings/serializers";
import { getEquipmentCatalog } from "@/lib/equipment/catalog";
import { getAdminDb } from "@/lib/firebase/admin";

export async function getCoordinatorDashboardData() {
  const [
    equipmentCatalog,
    availabilitySnapshot,
    bookingsSnapshot,
    usersSnapshot,
    coordinatorEmails,
    notificationRecipients
  ] = await Promise.all([
    getEquipmentCatalog(),
    getAdminDb().collection("disponibilidades").get(),
    getAdminDb().collection("agendamentos").get(),
    getAdminDb().collection("usuarios").get(),
    getCoordinatorEmails(),
    getNotificationRecipientEmails()
  ]);

  const availabilitySlots = availabilitySnapshot.docs
    .map((doc) => toAvailabilitySlot(doc.id, doc.data()))
    .sort((left, right) => {
      const dateCompare = left.data.localeCompare(right.data);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      return left.horaInicio.localeCompare(right.horaInicio);
    });

  const bookings = bookingsSnapshot.docs
    .map((doc) => toBooking(doc.id, doc.data()))
    .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0));

  const today = new Date().toISOString().slice(0, 10);

  const pendingCount = bookings.filter((booking) => booking.status === "pendente").length;
  const approvedCount = bookings.filter(
    (booking) => booking.status === "aprovado" && booking.dataSolicitada >= today
  ).length;
  const finalizedCount = bookings.filter(
    (booking) => booking.status === "aprovado" && booking.dataSolicitada < today
  ).length;
  const operationalCount = equipmentCatalog.filter((equipment) => equipment.status === "operacional").length;
  const trainedCount = usersSnapshot.docs.filter((doc) => {
    const data = doc.data();
    const trainings = data.treinamentos ?? {};
    return Boolean(trainings.laser || trainings.cnc);
  }).length;

  return {
    equipmentCatalog,
    availabilitySlots,
    bookings,
    coordinatorEmails,
    notificationRecipients,
    metrics: {
      pendingCount,
      approvedCount,
      finalizedCount,
      operationalCount,
      trainedCount
    }
  };
}

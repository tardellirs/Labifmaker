import "server-only";

import { getCoordinatorEmails, getNotificationRecipientEmails } from "@/lib/auth/access";
import { toAvailabilitySlot, toBooking } from "@/lib/bookings/serializers";
import { getEquipmentCatalog } from "@/lib/equipment/catalog";
import { getAdminDb } from "@/lib/firebase/admin";

// ─── Focused data-fetching functions ────────────────────────────────────────

export async function getCoordinatorBookingsData() {
  const bookingsSnapshot = await getAdminDb().collection("agendamentos").get();

  const bookings = bookingsSnapshot.docs
    .map((doc) => toBooking(doc.id, doc.data()))
    .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0));

  const today = new Date().toISOString().slice(0, 10);

  return {
    bookings,
    pendingCount: bookings.filter((booking) => booking.status === "pendente").length,
    approvedCount: bookings.filter(
      (booking) => booking.status === "aprovado" && booking.dataSolicitada >= today
    ).length,
    finalizedCount: bookings.filter(
      (booking) => booking.status === "aprovado" && booking.dataSolicitada < today
    ).length
  };
}

export async function getPendingBookings() {
  const snapshot = await getAdminDb()
    .collection("agendamentos")
    .where("status", "==", "pendente")
    .get();

  return snapshot.docs
    .map((doc) => toBooking(doc.id, doc.data()))
    .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0));
}

export async function getApprovedBookings() {
  const snapshot = await getAdminDb()
    .collection("agendamentos")
    .where("status", "==", "aprovado")
    .get();

  return snapshot.docs
    .map((doc) => toBooking(doc.id, doc.data()))
    .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0));
}

export async function getCoordinatorAvailabilityData() {
  const availabilitySnapshot = await getAdminDb().collection("disponibilidades").get();

  return availabilitySnapshot.docs
    .map((doc) => toAvailabilitySlot(doc.id, doc.data()))
    .sort((left, right) => {
      const dateCompare = left.data.localeCompare(right.data);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      return left.horaInicio.localeCompare(right.horaInicio);
    });
}

export async function getCoordinatorSettingsData() {
  const [coordinatorEmails, notificationRecipients] = await Promise.all([
    getCoordinatorEmails(),
    getNotificationRecipientEmails()
  ]);

  return { coordinatorEmails, notificationRecipients };
}

// ─── Facade: used only by the overview page ─────────────────────────────────

export async function getCoordinatorDashboardData() {
  const [
    equipmentCatalog,
    availabilitySlots,
    bookingsData,
    settingsData
  ] = await Promise.all([
    getEquipmentCatalog(),
    getCoordinatorAvailabilityData(),
    getCoordinatorBookingsData(),
    getCoordinatorSettingsData()
  ]);

  const operationalCount = equipmentCatalog.filter((equipment) => equipment.status === "operacional").length;

  return {
    equipmentCatalog,
    availabilitySlots,
    bookings: bookingsData.bookings,
    coordinatorEmails: settingsData.coordinatorEmails,
    notificationRecipients: settingsData.notificationRecipients,
    metrics: {
      pendingCount: bookingsData.pendingCount,
      approvedCount: bookingsData.approvedCount,
      finalizedCount: bookingsData.finalizedCount,
      operationalCount,
      notificationRecipientsCount: settingsData.notificationRecipients.length
    }
  };
}

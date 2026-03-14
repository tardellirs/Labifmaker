import "server-only";

import type { Booking } from "@/types";
import {
  buildGoogleCalendarDateTime,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getGoogleCalendarTimezone,
  isGoogleCalendarSyncEnabled,
  updateGoogleCalendarEvent
} from "@/lib/google-calendar/client";

function buildStatusLabel(status: Booking["status"]) {
  if (status === "aprovado") {
    return "Aprovado";
  }

  if (status === "pendente") {
    return "Pendente";
  }

  return "Rejeitado";
}

function buildBookingDescription(booking: Booking) {
  const details = Object.entries(booking.detalhesTecnicos)
    .map(([key, value]) => `${key}: ${String(value ?? "-")}`)
    .join("\n");

  return [
    `Status: ${buildStatusLabel(booking.status)}`,
    `Professor: ${booking.solicitanteNome}`,
    `E-mail: ${booking.solicitanteEmail}`,
    `Equipamento: ${booking.equipamentoNome}`,
    `Projeto: ${booking.projeto}`,
    `Descricao: ${booking.descricao}`,
    booking.justificativa ? `Comentario da coordenacao: ${booking.justificativa}` : "",
    details ? `Detalhes tecnicos:\n${details}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildBookingSummary(booking: Booking) {
  return `[${buildStatusLabel(booking.status)}] ${booking.equipamentoNome} - ${booking.projeto}`;
}

function buildPortalUrl(bookingId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!appUrl) {
    return undefined;
  }

  return `${appUrl}/coordenacao`;
}

export function isGoogleCalendarAvailable() {
  return isGoogleCalendarSyncEnabled();
}

export async function upsertBookingCalendarEvent(booking: Booking) {
  if (!isGoogleCalendarAvailable()) {
    return null;
  }

  const timezone = getGoogleCalendarTimezone();
  const payload = {
    summary: buildBookingSummary(booking),
    description: buildBookingDescription(booking),
    start: {
      dateTime: buildGoogleCalendarDateTime(booking.dataSolicitada, booking.horaInicio),
      timeZone: timezone
    },
    end: {
      dateTime: buildGoogleCalendarDateTime(booking.dataSolicitada, booking.horaFim),
      timeZone: timezone
    },
    source: buildPortalUrl(booking.id)
      ? {
          title: "LabIF Maker Jacarei",
          url: buildPortalUrl(booking.id)!
        }
      : undefined,
    extendedProperties: {
      private: {
        bookingId: booking.id,
        status: booking.status,
        equipmentId: booking.equipamentoId,
        requesterEmail: booking.solicitanteEmail
      }
    }
  };

  if (booking.googleCalendarEventId) {
    return updateGoogleCalendarEvent(booking.googleCalendarEventId, payload);
  }

  return createGoogleCalendarEvent(payload);
}

export async function removeBookingCalendarEvent(eventId?: string) {
  if (!isGoogleCalendarAvailable() || !eventId) {
    return;
  }

  await deleteGoogleCalendarEvent(eventId);
}

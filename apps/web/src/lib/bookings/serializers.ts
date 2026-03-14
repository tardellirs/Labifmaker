import { Timestamp } from "firebase-admin/firestore";

import type { AvailabilitySlot, Booking } from "@/types";

function castDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : undefined;
}

export function toBooking(id: string, data: Record<string, unknown> | undefined): Booking {
  return {
    id,
    solicitanteUid: String(data?.solicitanteUid ?? ""),
    solicitanteNome: String(data?.solicitanteNome ?? ""),
    solicitanteEmail: String(data?.solicitanteEmail ?? ""),
    disponibilidadeId:
      typeof data?.disponibilidadeId === "string" ? data.disponibilidadeId : undefined,
    equipamentoId: String(data?.equipamentoId ?? ""),
    equipamentoNome: String(data?.equipamentoNome ?? ""),
    equipamentoTipo: (data?.equipamentoTipo as Booking["equipamentoTipo"]) ?? "outro",
    status: (data?.status as Booking["status"]) ?? "pendente",
    dataSolicitada: String(data?.dataSolicitada ?? ""),
    horaInicio: String(data?.horaInicio ?? ""),
    horaFim: String(data?.horaFim ?? ""),
    projeto: String(data?.projeto ?? ""),
    descricao: String(data?.descricao ?? ""),
    sabeOperarEquipamento: Boolean(data?.sabeOperarEquipamento),
    detalhesTecnicos:
      typeof data?.detalhesTecnicos === "object" && data.detalhesTecnicos
        ? (data.detalhesTecnicos as Booking["detalhesTecnicos"])
        : {},
    justificativa: typeof data?.justificativa === "string" ? data.justificativa : undefined,
    avaliadorNome: typeof data?.avaliadorNome === "string" ? data.avaliadorNome : undefined,
    avaliadorEmail: typeof data?.avaliadorEmail === "string" ? data.avaliadorEmail : undefined,
    googleCalendarEventId:
      typeof data?.googleCalendarEventId === "string" ? data.googleCalendarEventId : undefined,
    googleCalendarHtmlLink:
      typeof data?.googleCalendarHtmlLink === "string" ? data.googleCalendarHtmlLink : undefined,
    googleCalendarSyncedAt: castDate(data?.googleCalendarSyncedAt),
    avaliadoEm: castDate(data?.avaliadoEm),
    createdAt: castDate(data?.createdAt),
    updatedAt: castDate(data?.updatedAt)
  };
}

export function formatBookingDetails(details: Booking["detalhesTecnicos"]) {
  return Object.entries(details)
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^\w/, (char) => char.toUpperCase());

      const formattedValue =
        typeof value === "boolean" ? (value ? "Sim" : "Nao") : String(value ?? "-");

      return `${label}: ${formattedValue}`;
    })
    .join("<br />");
}

export function toAvailabilitySlot(
  id: string,
  data: Record<string, unknown> | undefined
): AvailabilitySlot {
  return {
    id,
    data: String(data?.data ?? ""),
    horaInicio: String(data?.horaInicio ?? ""),
    horaFim: String(data?.horaFim ?? ""),
    ativo: data?.ativo !== false,
    criadoPorUid: String(data?.criadoPorUid ?? ""),
    criadoPorNome: String(data?.criadoPorNome ?? ""),
    createdAt: castDate(data?.createdAt),
    updatedAt: castDate(data?.updatedAt)
  };
}

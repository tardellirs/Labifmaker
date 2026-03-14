import type { EquipmentType } from "./equipment";

export type BookingStatus = "pendente" | "aprovado" | "rejeitado" | "cancelado";

export interface BookingDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export interface Booking {
  id: string;
  solicitanteUid: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  disponibilidadeId?: string;
  equipamentoId: string;
  equipamentoNome: string;
  equipamentoTipo: EquipmentType;
  status: BookingStatus;
  dataSolicitada: string;
  horaInicio: string;
  horaFim: string;
  projeto: string;
  descricao: string;
  sabeOperarEquipamento: boolean;
  detalhesTecnicos: BookingDetails;
  justificativa?: string;
  avaliadorNome?: string;
  avaliadorEmail?: string;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  googleCalendarSyncedAt?: Date;
  avaliadoEm?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

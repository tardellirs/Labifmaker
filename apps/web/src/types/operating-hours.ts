/** Faixa de horario no formato "HH:MM", fim exclusivo. */
export interface TimeRange {
  inicio: string;
  fim: string;
}

/** Chave: dia da semana como string, "0" (domingo) a "6" (sabado). */
export type WeeklySchedule = Record<string, TimeRange[]>;

export interface OperatingHours {
  semana: WeeklySchedule;
  atualizadoPorNome?: string;
  updatedAt?: Date;
}

export type ExceptionType = "fechado" | "aberto";

/**
 * Excecao pontual ao funcionamento semanal.
 * tipo "fechado" ignora `faixas`; tipo "aberto" substitui as faixas do dia.
 */
export interface AvailabilityException {
  id: string;
  data: string;
  tipo: ExceptionType;
  faixas: TimeRange[];
  motivo: string;
  criadoPorNome?: string;
  createdAt?: Date;
}

export type SlotStatus = "livre" | "pendente" | "ocupado";

export interface DaySlot {
  inicio: string;
  fim: string;
  status: SlotStatus;
}

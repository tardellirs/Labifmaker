import type {
  AvailabilityException,
  DaySlot,
  SlotStatus,
  TimeRange,
  WeeklySchedule
} from "@/types/operating-hours";

/** Tamanho do bloco oferecido ao professor, em minutos. */
export const SLOT_MINUTES = 60;

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Dia da semana de uma data "YYYY-MM-DD".
 *
 * Monta a data pelo construtor local em vez de new Date(iso): a string ISO e
 * interpretada como UTC, e em fuso negativo (Brasil, UTC-3) isso cai no dia
 * anterior e devolveria o dia da semana errado.
 */
export function weekdayOf(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

/** Data local (nunca UTC) para "YYYY-MM-DD". */
export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Soma dias sem passar por UTC; o construtor local acerta virada de mes e horario de verao. */
export function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return toIsoDate(new Date(year, month - 1, day + days));
}

/** Segunda-feira da semana da data informada. */
export function startOfWeek(isoDate: string) {
  const weekday = weekdayOf(isoDate);
  return addDays(isoDate, weekday === 0 ? -6 : 1 - weekday);
}

/** Fuso do laboratorio. O servidor roda em UTC, entao a data local dele nao serve. */
export const LAB_TIME_ZONE = "America/Sao_Paulo";

/**
 * Hoje no fuso do laboratorio.
 *
 * Usar a data local quebraria no servidor: a partir das 21h no Brasil, UTC ja
 * esta no dia seguinte, e um agendamento para hoje seria recusado como passado.
 * Cliente e servidor calculam o mesmo dia usando o fuso explicito.
 */
export function todayIso(timeZone: string = LAB_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

/** Intervalos se sobrepoem? Fim e exclusivo, entao 08:00-09:00 e 09:00-10:00 nao colidem. */
export function overlaps(left: TimeRange, right: TimeRange) {
  return toMinutes(left.inicio) < toMinutes(right.fim)
    && toMinutes(right.inicio) < toMinutes(left.fim);
}

/** Quebra faixas em blocos inteiros; sobra menor que um bloco e descartada. */
export function expandRanges(ranges: TimeRange[], slotMinutes = SLOT_MINUTES): TimeRange[] {
  const blocks: TimeRange[] = [];

  for (const range of ranges) {
    const end = toMinutes(range.fim);

    for (let start = toMinutes(range.inicio); start + slotMinutes <= end; start += slotMinutes) {
      blocks.push({ inicio: toTime(start), fim: toTime(start + slotMinutes) });
    }
  }

  return blocks.sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Faixas validas de uma data: regra semanal, sobrescrita pela excecao do dia. */
export function rangesForDate(
  schedule: WeeklySchedule,
  exceptions: AvailabilityException[],
  isoDate: string
): TimeRange[] {
  const exception = exceptions.find((item) => item.data === isoDate);

  if (exception) {
    return exception.tipo === "fechado" ? [] : exception.faixas;
  }

  return schedule[String(weekdayOf(isoDate))] ?? [];
}

/**
 * Agendamento ja existente, reduzido ao que importa para o calculo.
 * `bloqueia` distingue aprovado (ocupa) de pendente (apenas sinaliza).
 */
export interface OccupiedRange extends TimeRange {
  bloqueia: boolean;
}

/**
 * Blocos de um dia com o status de cada um.
 *
 * Pendente nao bloqueia de proposito: como toda solicitacao passa por aprovacao
 * manual, um pedido esquecido na fila congelaria o horario para todos. O bloco
 * segue solicitavel e a coordenacao ve os pedidos concorrentes na fila.
 */
export function buildDaySlots(ranges: TimeRange[], occupied: OccupiedRange[]): DaySlot[] {
  return expandRanges(ranges).map((block) => {
    const colliding = occupied.filter((item) => overlaps(block, item));

    const status: SlotStatus = colliding.some((item) => item.bloqueia)
      ? "ocupado"
      : colliding.length > 0
        ? "pendente"
        : "livre";

    return { ...block, status };
  });
}

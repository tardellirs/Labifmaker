import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import type { DaySlot } from "@/types/operating-hours";

import { addDays, buildDaySlots, rangesForDate, startOfWeek, weekdayOf } from "./compute";
import type { OccupiedRange } from "./compute";
import { getAvailabilityExceptions, getOperatingHours } from "./store";

export interface ScheduleDay {
  data: string;
  diaSemana: number;
  fechado: boolean;
  blocos: DaySlot[];
}

export interface WeekSchedule {
  inicio: string;
  fim: string;
  dias: ScheduleDay[];
}

/**
 * Semana (segunda a domingo) com o status de cada bloco para um equipamento.
 *
 * Os agendamentos sao buscados por faixa de datas num unico campo, o que usa o
 * indice automatico do Firestore; equipamento e status sao cruzados em memoria
 * para nao exigir indice composto.
 */
export async function getWeekSchedule(
  referenciaIso: string,
  equipamentoId: string
): Promise<WeekSchedule> {
  const inicio = startOfWeek(referenciaIso);
  const datas = Array.from({ length: 7 }, (_, index) => addDays(inicio, index));
  const fim = datas[datas.length - 1];

  const [operatingHours, exceptions, bookingsSnapshot] = await Promise.all([
    getOperatingHours(),
    getAvailabilityExceptions(inicio),
    getAdminDb()
      .collection("agendamentos")
      .where("dataSolicitada", ">=", inicio)
      .where("dataSolicitada", "<=", fim)
      .get()
  ]);

  const ocupadosPorData = new Map<string, OccupiedRange[]>();

  for (const doc of bookingsSnapshot.docs) {
    const booking = doc.data();

    const relevante =
      booking.equipamentoId === equipamentoId &&
      (booking.status === "aprovado" || booking.status === "pendente") &&
      typeof booking.horaInicio === "string" &&
      typeof booking.horaFim === "string";

    if (!relevante) continue;

    const data = String(booking.dataSolicitada);
    const lista = ocupadosPorData.get(data) ?? [];

    lista.push({
      inicio: booking.horaInicio,
      fim: booking.horaFim,
      bloqueia: booking.status === "aprovado"
    });

    ocupadosPorData.set(data, lista);
  }

  const dias = datas.map<ScheduleDay>((data) => {
    const faixas = rangesForDate(operatingHours.semana, exceptions, data);

    return {
      data,
      diaSemana: weekdayOf(data),
      fechado: faixas.length === 0,
      blocos: buildDaySlots(faixas, ocupadosPorData.get(data) ?? [])
    };
  });

  return { inicio, fim, dias };
}

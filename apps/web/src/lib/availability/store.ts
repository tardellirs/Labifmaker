import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import type {
  AvailabilityException,
  OperatingHours,
  TimeRange,
  WeeklySchedule
} from "@/types/operating-hours";

const SETTINGS_COLLECTION = "configuracoes";
const OPERATING_HOURS_DOC = "funcionamento";
const EXCEPTIONS_COLLECTION = "excecoes";

/** Seg a sex, 08:00 as 17:00. Serve so ate a coordenacao salvar a regra real. */
export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  "0": [],
  "1": [{ inicio: "08:00", fim: "17:00" }],
  "2": [{ inicio: "08:00", fim: "17:00" }],
  "3": [{ inicio: "08:00", fim: "17:00" }],
  "4": [{ inicio: "08:00", fim: "17:00" }],
  "5": [{ inicio: "08:00", fim: "17:00" }],
  "6": []
};

function normalizeRanges(value: unknown): TimeRange[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is TimeRange =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as TimeRange).inicio === "string" &&
        typeof (item as TimeRange).fim === "string"
    )
    .map((item) => ({ inicio: item.inicio, fim: item.fim }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

function toDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : undefined;
}

/**
 * Leitura sem cache, de proposito.
 *
 * Um cache em memoria aqui viveria em UMA instancia serverless e faria a tela
 * voltar a mostrar o horario antigo logo depois de salvar - o mesmo problema
 * ja documentado para o cache de acesso em lib/auth/access.ts.
 */
export async function getOperatingHours(): Promise<OperatingHours> {
  const snapshot = await getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(OPERATING_HOURS_DOC)
    .get();

  const data = snapshot.data();

  if (!data?.semana) {
    return { semana: DEFAULT_WEEKLY_SCHEDULE };
  }

  const stored = data.semana as Record<string, unknown>;
  const semana: WeeklySchedule = {};

  for (const weekday of ["0", "1", "2", "3", "4", "5", "6"]) {
    semana[weekday] = normalizeRanges(stored[weekday]);
  }

  return {
    semana,
    atualizadoPorNome:
      typeof data.atualizadoPorNome === "string" ? data.atualizadoPorNome : undefined,
    updatedAt: toDate(data.updatedAt)
  };
}

export async function setOperatingHours(semana: WeeklySchedule, atualizadoPorNome: string) {
  await getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(OPERATING_HOURS_DOC)
    .set(
      { semana, atualizadoPorNome, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

  return getOperatingHours();
}

export async function getAvailabilityExceptions(fromIsoDate?: string) {
  let query = getAdminDb().collection(EXCEPTIONS_COLLECTION).orderBy("data", "asc");

  if (fromIsoDate) {
    query = query.where("data", ">=", fromIsoDate);
  }

  const snapshot = await query.get();

  return snapshot.docs.map<AvailabilityException>((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      data: String(data.data ?? ""),
      tipo: data.tipo === "aberto" ? "aberto" : "fechado",
      faixas: normalizeRanges(data.faixas),
      motivo: String(data.motivo ?? ""),
      criadoPorNome: typeof data.criadoPorNome === "string" ? data.criadoPorNome : undefined,
      createdAt: toDate(data.createdAt)
    };
  });
}

import { z } from "zod";

import { toMinutes } from "./compute";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario deve estar no formato HH:MM.");

export const timeRangeSchema = z
  .object({ inicio: timeSchema, fim: timeSchema })
  .refine((range) => toMinutes(range.inicio) < toMinutes(range.fim), {
    message: "O horario final deve ser maior que o inicial."
  });

/** Faixas de um mesmo dia nao podem se sobrepor nem ficar fora de ordem. */
const dayRangesSchema = z.array(timeRangeSchema).max(6).superRefine((ranges, ctx) => {
  const ordered = [...ranges].sort((a, b) => a.inicio.localeCompare(b.inicio));

  for (let index = 1; index < ordered.length; index += 1) {
    if (toMinutes(ordered[index].inicio) < toMinutes(ordered[index - 1].fim)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As faixas de um mesmo dia nao podem se sobrepor."
      });
      return;
    }
  }
});

export const weeklyScheduleSchema = z.record(
  z.enum(["0", "1", "2", "3", "4", "5", "6"]),
  dayRangesSchema
);

export const updateOperatingHoursSchema = z.object({
  semana: weeklyScheduleSchema
});

export const upsertExceptionSchema = z
  .object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida."),
    tipo: z.enum(["fechado", "aberto"]),
    faixas: z.array(timeRangeSchema).max(6).default([]),
    motivo: z.string().trim().min(1, "Informe o motivo.").max(200)
  })
  .refine((value) => value.tipo === "fechado" || value.faixas.length > 0, {
    message: "Uma excecao de abertura precisa de pelo menos uma faixa.",
    path: ["faixas"]
  });

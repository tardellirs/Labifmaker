import { z } from "zod";

function createTimeStringSchema(fieldLabel: string) {
  return z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, `${fieldLabel} deve estar no formato HH:MM.`);
}

const baseBookingSchema = z.object({
  equipamentoId: z.string().min(1, "Selecione um equipamento."),
  disponibilidadeId: z.string().min(1, "Selecione um horario disponivel."),
  dataSolicitada: z.string().date(),
  horaInicio: createTimeStringSchema("Hora inicial"),
  horaFim: createTimeStringSchema("Hora final"),
  projeto: z.string().min(3, "Informe um titulo para o projeto."),
  descricao: z.string().min(10, "Descreva brevemente a atividade."),
  sabeOperarEquipamento: z.boolean(),
  concordaTermos: z.literal(true)
});

export const createAvailabilitySchema = z
  .object({
    data: z.string().date(),
    horaInicio: createTimeStringSchema("Hora inicial"),
    horaFim: createTimeStringSchema("Hora final")
  })
  .refine((data) => data.horaInicio < data.horaFim, {
    message: "A hora final deve ser maior que a hora inicial.",
    path: ["horaFim"]
  });

export const updateAvailabilitySchema = z.object({
  availabilityId: z.string().min(1),
  ativo: z.boolean()
});

export const updateEquipmentStatusSchema = z.object({
  equipmentId: z.string().min(1),
  status: z.union([z.literal("operacional"), z.literal("manutencao")])
});

export const createEquipmentSchema = z.object({
  nome: z.string().min(3, "Informe o nome do equipamento."),
  observacoes: z.string().optional()
});

export const deleteEquipmentSchema = z.object({
  equipmentId: z.string().min(1)
});

export const reorderEquipmentSchema = z.object({
  equipmentIds: z.array(z.string().min(1)).min(1, "Informe a ordem dos equipamentos.")
});

export const createBookingSchema = baseBookingSchema.refine((data) => data.horaInicio < data.horaFim, {
  message: "A hora final deve ser maior que a hora inicial.",
  path: ["horaFim"]
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;

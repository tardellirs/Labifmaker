export interface AvailabilitySlot {
  id: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
  criadoPorUid: string;
  criadoPorNome: string;
  createdAt?: Date;
  updatedAt?: Date;
}

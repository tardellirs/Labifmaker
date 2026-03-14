export type EquipmentStatus = "operacional" | "manutencao";
export type EquipmentType = "impressora_3d" | "laser" | "cnc" | "outro";

export interface Equipment {
  id: string;
  nome: string;
  tipo: EquipmentType;
  status: EquipmentStatus;
  requerTreinamento: boolean;
  materiaisProibidos?: string[];
  observacoes?: string;
}

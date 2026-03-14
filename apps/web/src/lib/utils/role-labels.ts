import type { UserRole } from "@/types";

export function getRoleLabel(papel: UserRole): string {
  switch (papel) {
    case "coordenador":
      return "Coordenação";
    case "aluno":
      return "Aluno";
    case "externo":
      return "Usuário Externo";
    default:
      return "Professor";
  }
}

export function getPanelLabel(papel: UserRole): string {
  switch (papel) {
    case "aluno":
      return "Painel do Aluno";
    case "externo":
      return "Painel do Usuário";
    default:
      return "Painel do professor";
  }
}

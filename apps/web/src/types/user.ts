import type { DecodedIdToken } from "firebase-admin/auth";

export type UserRole = "professor" | "aluno" | "externo" | "coordenador";

export interface UserTrainingMatrix {
  impressora3d?: boolean;
  laser?: boolean;
  cnc?: boolean;
}

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  papel: UserRole;
  campus: string;
  fotoUrl?: string;
  treinamentos: UserTrainingMatrix;
  createdAt?: Date;
  updatedAt?: Date;
  ultimoLoginEm?: Date;
}

export interface AuthenticatedSession {
  uid: string;
  email: string;
  nome: string;
  fotoUrl?: string;
  papel: UserRole;
  profile: UserProfile | null;
  claims: DecodedIdToken;
}

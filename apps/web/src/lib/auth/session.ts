import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";

import { isCoordinatorEmail, isPrimaryIfspEmail, isStudentEmail } from "@/lib/auth/access";
import type { UserProfile, UserRole } from "@/types";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "labifmaker_session";

export const SESSION_EXPIRES_IN =
  Number(process.env.SESSION_EXPIRES_IN_DAYS ?? 5) * 24 * 60 * 60 * 1000;

export async function resolveUserRole(
  email?: string | null,
  claimsRole?: string | null,
  firestoreRole?: string | null
): Promise<UserRole> {
  if (
    (await isCoordinatorEmail(email)) ||
    claimsRole === "coordenador" ||
    firestoreRole === "coordenador"
  ) {
    return "coordenador";
  }

  if (isStudentEmail(email)) return "aluno";
  if (!isPrimaryIfspEmail(email)) return "externo";

  return "professor";
}

export async function buildUserProfilePayload(
  decodedToken: DecodedIdToken,
  existingProfile?: Partial<UserProfile> | null
) {
  const papel = await resolveUserRole(
    decodedToken.email,
    decodedToken.role as string | null,
    existingProfile?.papel ?? null
  );

  return {
    uid: decodedToken.uid,
    nome: decodedToken.name ?? decodedToken.email?.split("@")[0] ?? "Usuario IFSP",
    email: decodedToken.email ?? "",
    papel,
    campus: existingProfile?.campus ?? "Jacarei",
    fotoUrl: decodedToken.picture,
    treinamentos: existingProfile?.treinamentos ?? {
      impressora3d: false,
      laser: false,
      cnc: false
    },
    updatedAt: FieldValue.serverTimestamp(),
    ultimoLoginEm: FieldValue.serverTimestamp(),
    ...(existingProfile ? {} : { createdAt: FieldValue.serverTimestamp() })
  };
}

export function toUserProfile(data: Record<string, unknown> | undefined | null): UserProfile | null {
  if (!data) {
    return null;
  }

  const castDate = (value: unknown) =>
    value instanceof Timestamp ? value.toDate() : undefined;

  return {
    uid: String(data.uid ?? ""),
    nome: String(data.nome ?? ""),
    email: String(data.email ?? ""),
    papel:
      data.papel === "coordenador"
        ? "coordenador"
        : data.papel === "aluno"
          ? "aluno"
          : data.papel === "externo"
            ? "externo"
            : "professor",
    campus: String(data.campus ?? "Jacarei"),
    fotoUrl: typeof data.fotoUrl === "string" ? data.fotoUrl : undefined,
    treinamentos:
      typeof data.treinamentos === "object" && data.treinamentos
        ? (data.treinamentos as UserProfile["treinamentos"])
        : {},
    createdAt: castDate(data.createdAt),
    updatedAt: castDate(data.updatedAt),
    ultimoLoginEm: castDate(data.ultimoLoginEm)
  };
}

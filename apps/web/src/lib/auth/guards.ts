import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isCoordinatorEmail, isPrimaryIfspEmail, isStudentEmail } from "@/lib/auth/access";
import { SESSION_COOKIE_NAME, toUserProfile } from "@/lib/auth/session";
import type { AuthenticatedSession, UserRole } from "@/types";

export const getCurrentSession = cache(async (): Promise<AuthenticatedSession | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);

    const [userSnapshot, isCoordinator] = await Promise.all([
      getAdminDb().collection("usuarios").doc(decodedToken.uid).get(),
      isCoordinatorEmail(decodedToken.email)
    ]);

    const profile = toUserProfile(userSnapshot.data());

    // role is derived from the email domain so it stays correct regardless
    // of what was previously stored in the Firestore user document
    // O papel guardado no documento do usuario NAO entra aqui.
    //
    // Ele e escrito a cada login a partir do papel vigente, entao le-lo de
    // volta o tornava permanente: quem virasse coordenador uma vez continuaria
    // coordenador para sempre, e tirar o e-mail da lista nao revogava nada.
    // A lista de coordenadores e a unica fonte de verdade.
    const papel: UserRole =
      isCoordinator || decodedToken.role === "coordenador"
        ? "coordenador"
        : isStudentEmail(decodedToken.email)
          ? "aluno"
          : isPrimaryIfspEmail(decodedToken.email)
            ? "professor"
            : "externo";

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? profile?.email ?? "",
      nome: decodedToken.name ?? profile?.nome ?? "Usuario IFSP",
      fotoUrl: decodedToken.picture ?? profile?.fotoUrl,
      papel,
      profile,
      claims: decodedToken
    };
  } catch {
    return null;
  }
});

export async function requireAuthenticatedUser() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireCoordinator() {
  const session = await requireAuthenticatedUser();

  if (session.papel !== "coordenador") {
    redirect("/app");
  }

  return session;
}

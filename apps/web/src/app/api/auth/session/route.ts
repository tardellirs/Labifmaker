import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isAllowedLoginEmail } from "@/lib/auth/access";
import { buildUserProfilePayload, SESSION_COOKIE_NAME, SESSION_EXPIRES_IN } from "@/lib/auth/session";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { UserProfile } from "@/types";

const bodySchema = z.object({
  idToken: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { idToken } = bodySchema.parse(await request.json());
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    // run authorization check, session cookie creation, and user fetch in parallel
    const [isAllowed, sessionCookie, existingUser] = await Promise.all([
      isAllowedLoginEmail(decodedToken.email),
      adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN }),
      adminDb.collection("usuarios").doc(decodedToken.uid).get()
    ]);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Acesso permitido para @ifsp.edu.br ou e-mails autorizados na coordenacao." },
        { status: 403 }
      );
    }

    const existingProfile = existingUser.exists
      ? (existingUser.data() as Partial<UserProfile>)
      : null;

    // user profile upsert does not block the response
    const userRef = adminDb.collection("usuarios").doc(decodedToken.uid);
    void buildUserProfilePayload(decodedToken, existingProfile).then((payload) =>
      userRef.set(payload, { merge: true })
    );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRES_IN / 1000
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao criar a sessao." }, { status: 400 });
  }
}

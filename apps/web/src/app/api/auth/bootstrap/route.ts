import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/guards";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      uid: session.uid,
      nome: session.nome,
      email: session.email,
      papel: session.papel,
      treinamentos: session.profile?.treinamentos ?? {}
    }
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { getAccessSettings, setAccessSettings } from "@/lib/auth/access";
import { getCurrentSession } from "@/lib/auth/guards";

function ensureCoordinator(papel: string) {
  if (papel !== "coordenador") {
    throw new Error("Acesso restrito a coordenadores.");
  }
}

const patchSchema = z.object({
  allowStudents: z.boolean().optional(),
  allowExternalUsers: z.boolean().optional()
});

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    ensureCoordinator(session.papel);

    const settings = await getAccessSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao buscar configurações." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    ensureCoordinator(session.papel);

    const body = patchSchema.parse(await request.json());
    await setAccessSettings(body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Falha ao salvar configurações.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

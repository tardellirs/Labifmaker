import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/guards";
import { updateOperatingHoursSchema } from "@/lib/availability/schema";
import { getOperatingHours, setOperatingHours } from "@/lib/availability/store";

async function requireCoordinatorSession() {
  const session = await getCurrentSession();
  return session && session.papel === "coordenador" ? session : null;
}

export async function GET() {
  if (!(await requireCoordinatorSession())) {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  return NextResponse.json({ ...(await getOperatingHours()) });
}

export async function PUT(request: Request) {
  const session = await requireCoordinatorSession();

  if (!session) {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = updateOperatingHoursSchema.parse(await request.json());
    const saved = await setOperatingHours(payload.semana, session.nome);

    // devolve o estado salvo para a tela nao depender de uma releitura
    return NextResponse.json({ ok: true, semana: saved.semana });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error && "issues" in error
        ? "Verifique as faixas informadas: nao podem se sobrepor e o fim deve ser maior que o inicio."
        : "Falha ao salvar o horario de funcionamento.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

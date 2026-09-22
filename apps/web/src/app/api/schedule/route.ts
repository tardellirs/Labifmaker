import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/guards";
import { todayIso } from "@/lib/availability/compute";
import { getWeekSchedule } from "@/lib/availability/week";

export async function GET(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const equipamentoId = searchParams.get("equipamentoId");
  const referencia = searchParams.get("data") ?? todayIso();

  if (!equipamentoId) {
    return NextResponse.json({ error: "equipamentoId e obrigatorio." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(referencia)) {
    return NextResponse.json({ error: "Data invalida." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getWeekSchedule(referencia, equipamentoId));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao carregar a semana." }, { status: 500 });
  }
}

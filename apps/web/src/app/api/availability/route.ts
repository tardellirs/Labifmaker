import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/guards";
import {
  createAvailabilitySchema,
  updateAvailabilitySchema
} from "@/lib/bookings/schema";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || session.papel !== "coordenador") {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = createAvailabilitySchema.parse(await request.json());

    const db = getAdminDb();
    const ref = db.collection("disponibilidades").doc();

    await ref.set({
      data: payload.data,
      horaInicio: payload.horaInicio,
      horaFim: payload.horaFim,
      ativo: true,
      criadoPorUid: session.uid,
      criadoPorNome: session.nome,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ ok: true, availabilityId: ref.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao criar horario disponivel." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();

  if (!session || session.papel !== "coordenador") {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = updateAvailabilitySchema.parse(await request.json());

    await getAdminDb().collection("disponibilidades").doc(payload.availabilityId).set(
      {
        ativo: payload.ativo,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao atualizar disponibilidade." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();

  if (!session || session.papel !== "coordenador") {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const availabilityId = searchParams.get("availabilityId");

    if (!availabilityId) {
      return NextResponse.json({ error: "availabilityId é obrigatório." }, { status: 400 });
    }

    await getAdminDb().collection("disponibilidades").doc(availabilityId).delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao excluir disponibilidade." }, { status: 400 });
  }
}

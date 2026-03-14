import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { requireCoordinator } from "@/lib/auth/guards";
import {
  createEquipmentSchema,
  deleteEquipmentSchema,
  reorderEquipmentSchema,
  updateEquipmentStatusSchema
} from "@/lib/bookings/schema";
import { getAdminDb } from "@/lib/firebase/admin";

function slugifyEquipmentName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const session = await requireCoordinator();

  if (session.papel !== "coordenador") {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = createEquipmentSchema.parse(await request.json());
    const equipmentId = slugifyEquipmentName(payload.nome);

    if (!equipmentId) {
      return NextResponse.json({ error: "Nome de equipamento inválido." }, { status: 400 });
    }

    const ref = getAdminDb().collection("equipamentos").doc(equipmentId);
    const snapshot = await ref.get();

    if (snapshot.exists) {
      return NextResponse.json({ error: "Já existe um equipamento com esse nome." }, { status: 409 });
    }

    await ref.set({
      id: equipmentId,
      nome: payload.nome,
      tipo: "outro",
      status: "operacional",
      requerTreinamento: false,
      ...(payload.observacoes?.trim() ? { observacoes: payload.observacoes.trim() } : {}),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    const configRef = getAdminDb().collection("configuracoes").doc("equipamentos");
    const configSnap = await configRef.get();
    const currentOrder = (configSnap.data()?.ordem as string[]) ?? [];
    if (!currentOrder.includes(equipmentId)) {
      await configRef.set(
        { ordem: [...currentOrder, equipmentId], updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true, equipmentId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao cadastrar equipamento." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireCoordinator();

  if (session.papel !== "coordenador") {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = updateEquipmentStatusSchema.parse(await request.json());

    await getAdminDb()
      .collection("equipamentos")
      .doc(payload.equipmentId)
      .set(
        {
          status: payload.status,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao atualizar equipamento." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await requireCoordinator();

  if (session.papel !== "coordenador") {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = reorderEquipmentSchema.parse(await request.json());

    await getAdminDb()
      .collection("configuracoes")
      .doc("equipamentos")
      .set(
        { ordem: payload.equipmentIds, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao reordenar equipamentos." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireCoordinator();

  if (session.papel !== "coordenador") {
    return NextResponse.json({ error: "Acesso restrito a coordenadores." }, { status: 403 });
  }

  try {
    const payload = deleteEquipmentSchema.parse(await request.json());
    const db = getAdminDb();

    await db.collection("equipamentos").doc(payload.equipmentId).delete();

    const configRef = db.collection("configuracoes").doc("equipamentos");
    const configSnap = await configRef.get();
    const currentOrder = (configSnap.data()?.ordem as string[]) ?? [];
    const newOrder = currentOrder.filter((id) => id !== payload.equipmentId);
    if (newOrder.length !== currentOrder.length) {
      await configRef.set(
        { ordem: newOrder, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao remover equipamento." }, { status: 400 });
  }
}

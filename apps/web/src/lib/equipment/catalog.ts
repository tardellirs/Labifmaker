import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import type { Equipment, EquipmentType } from "@/types";

const DEFAULT_EQUIPMENT_CATALOG: Equipment[] = [
  {
    id: "impressora-3d",
    nome: "Impressora 3D",
    tipo: "impressora_3d",
    status: "operacional",
    requerTreinamento: false,
    observacoes: "Uso orientado para prototipagem e validação da disponibilidade do laboratório."
  },
  {
    id: "cortadora-laser",
    nome: "Cortadora a Laser",
    tipo: "laser",
    status: "operacional",
    requerTreinamento: true,
    materiaisProibidos: ["PVC", "Vinil", "Policarbonato", "ABS"],
    observacoes: "Uso sujeito à disponibilidade do laboratório e à avaliação da coordenação."
  },
  {
    id: "fresadora-cnc",
    nome: "Fresadora CNC",
    tipo: "cnc",
    status: "operacional",
    requerTreinamento: true,
    observacoes: "Uso sujeito à disponibilidade do laboratório e à avaliação da coordenação."
  }
];

function toEquipment(
  id: string,
  data: Record<string, unknown> | undefined
): Equipment {
  return {
    id,
    nome: String(data?.nome ?? id),
    tipo: (data?.tipo as EquipmentType) ?? "outro",
    status: data?.status === "manutencao" ? "manutencao" : "operacional",
    requerTreinamento: Boolean(data?.requerTreinamento),
    materiaisProibidos: Array.isArray(data?.materiaisProibidos)
      ? (data?.materiaisProibidos as string[])
      : undefined,
    observacoes: typeof data?.observacoes === "string" ? data.observacoes : undefined
  };
}

export async function ensureEquipmentCatalog() {
  const db = getAdminDb();
  const refs = DEFAULT_EQUIPMENT_CATALOG.map((equipment) =>
    db.collection("equipamentos").doc(equipment.id)
  );
  const snapshots = await db.getAll(...refs);

  const created = DEFAULT_EQUIPMENT_CATALOG.filter((_, index) => !snapshots[index]?.exists);
  await Promise.all(
    created.map((equipment) =>
      db.collection("equipamentos").doc(equipment.id).set(equipment)
    )
  );

  if (created.length > 0) {
    const configRef = db.collection("configuracoes").doc("equipamentos");
    const configSnap = await configRef.get();
    const currentOrder = (configSnap.data()?.ordem as string[]) ?? [];
    const defaultIds = DEFAULT_EQUIPMENT_CATALOG.map((e) => e.id);
    const mergedOrder = [
      ...currentOrder.filter((id) => defaultIds.includes(id)),
      ...defaultIds.filter((id) => !currentOrder.includes(id))
    ];
    if (mergedOrder.length > 0) {
      await configRef.set(
        { ordem: mergedOrder, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  }
}

function sortByOrder<T extends { id: string; nome: string }>(
  items: T[],
  order: string[]
): T[] {
  if (order.length === 0) {
    return [...items].sort((a, b) => a.nome.localeCompare(b.nome));
  }
  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered: T[] = [];
  for (const id of order) {
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
      byId.delete(id);
    }
  }
  const remaining = [...byId.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  return [...ordered, ...remaining];
}

export async function getEquipmentCatalog() {
  const db = getAdminDb();
  const [equipSnapshot, configSnapshot] = await Promise.all([
    db.collection("equipamentos").get(),
    db.collection("configuracoes").doc("equipamentos").get()
  ]);

  if (equipSnapshot.empty) {
    await ensureEquipmentCatalog();
    const retrySnapshot = await db.collection("equipamentos").get();
    const items = retrySnapshot.docs.map((doc) => toEquipment(doc.id, doc.data()));
    const order = (configSnapshot.data()?.ordem as string[]) ?? [];
    return sortByOrder(items, order);
  }

  const items = equipSnapshot.docs.map((doc) => toEquipment(doc.id, doc.data()));
  const order = (configSnapshot.data()?.ordem as string[]) ?? [];
  return sortByOrder(items, order);
}

export function getDefaultEquipmentCatalog() {
  return DEFAULT_EQUIPMENT_CATALOG;
}

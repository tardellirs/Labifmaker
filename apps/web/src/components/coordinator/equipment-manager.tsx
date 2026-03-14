"use client";

import { useCallback, useEffect, useRef, startTransition, useState } from "react";
import { GripVertical, LoaderCircle, Plus, Trash2, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Equipment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EquipmentManagerProps {
  equipmentCatalog: Equipment[];
}

const initialState = {
  nome: "",
  observacoes: ""
};

export function EquipmentManager({ equipmentCatalog }: EquipmentManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [localCatalog, setLocalCatalog] = useState(equipmentCatalog);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const localCatalogRef = useRef(localCatalog);
  localCatalogRef.current = localCatalog;

  const equipmentCatalogRef = useRef(equipmentCatalog);
  equipmentCatalogRef.current = equipmentCatalog;

  useEffect(() => {
    setLocalCatalog(equipmentCatalog);
  }, [equipmentCatalog]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/equipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formState.nome,
          observacoes: formState.observacoes || undefined
        })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao cadastrar equipamento.");
      }

      toast.success("Equipamento cadastrado com sucesso.");
      setFormState(initialState);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao cadastrar equipamento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(equipment: Equipment) {
    setUpdatingId(equipment.id);

    try {
      const nextStatus = equipment.status === "operacional" ? "manutencao" : "operacional";
      const response = await fetch("/api/equipments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId: equipment.id, status: nextStatus })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao atualizar equipamento.");
      }

      toast.success(
        nextStatus === "operacional"
          ? `${equipment.nome} marcado como disponível.`
          : `${equipment.nome} marcado em manutenção.`
      );
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar equipamento.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(equipment: Equipment) {
    setRemovingId(equipment.id);

    try {
      const response = await fetch("/api/equipments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId: equipment.id })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao remover equipamento.");
      }

      toast.success(`${equipment.nome} removido com sucesso.`);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao remover equipamento.");
    } finally {
      setRemovingId(null);
    }
  }

  const handleGripMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setDraggingId(id);
  }, []);

  const handleItemMouseEnter = useCallback(
    (targetId: string) => {
      if (!draggingId || draggingId === targetId) return;

      setLocalCatalog((current) => {
        const fromIdx = current.findIndex((e) => e.id === draggingId);
        const toIdx = current.findIndex((e) => e.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return current;

        const reordered = [...current];
        const [item] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, item);
        return reordered;
      });
    },
    [draggingId]
  );

  useEffect(() => {
    if (!draggingId) return;

    const commit = async () => {
      const catalog = localCatalogRef.current;
      setDraggingId(null);

      const ids = catalog.map((e) => e.id);
      setReordering(true);
      try {
        const response = await fetch("/api/equipments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equipmentIds: ids })
        });
        const result = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(result.error ?? "Falha ao salvar ordem.");
        }

        toast.success("Ordem salva.");
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Falha ao salvar ordem.");
        setLocalCatalog(equipmentCatalogRef.current);
      } finally {
        setReordering(false);
      }
    };

    document.addEventListener("mouseup", commit);
    return () => document.removeEventListener("mouseup", commit);
  }, [draggingId]);

  const isDragging = Boolean(draggingId);

  return (
    <div
      className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]"
      style={{ userSelect: isDragging ? "none" : undefined }}
    >
      <Card>
        <Badge variant="brand">Equipamentos</Badge>
        <CardTitle className="mt-4">Cadastre e organize os equipamentos do laboratório.</CardTitle>
        <CardDescription className="mt-3">
          Os equipamentos cadastrados aqui aparecem automaticamente no painel e no formulário do professor.
        </CardDescription>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreate(event)}>
          <div className="space-y-2">
            <Label htmlFor="equipment-name">Nome do equipamento</Label>
            <Input
              id="equipment-name"
              onChange={(event) =>
                setFormState((current) => ({ ...current, nome: event.target.value }))
              }
              placeholder="Ex.: Plotter de recorte"
              required
              value={formState.nome}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment-notes">Observações</Label>
            <Textarea
              id="equipment-notes"
              onChange={(event) =>
                setFormState((current) => ({ ...current, observacoes: event.target.value }))
              }
              placeholder="Ex.: Uso orientado apenas com apoio da coordenação."
              value={formState.observacoes}
            />
          </div>

          <Button disabled={saving} type="submit">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar equipamento
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <Wrench className="h-5 w-5 text-brand-600" />
          <CardTitle>Equipamentos cadastrados</CardTitle>
        </div>
        <CardDescription className="mt-3">
          Arraste pelo ícone <GripVertical className="inline h-3.5 w-3.5 align-text-bottom" /> para reordenar. Altere a disponibilidade ou remova equipamentos que não devem mais aparecer no sistema.
        </CardDescription>

        <div
          className="mt-6 space-y-3"
          style={{ cursor: isDragging ? "grabbing" : undefined }}
        >
          {localCatalog.map((equipment) => {
            const isBeingDragged = draggingId === equipment.id;
            return (
              <div
                key={equipment.id}
                className={`flex items-start gap-3 rounded-[20px] border px-4 py-4 transition-all duration-150 ${
                  isBeingDragged
                    ? "border-brand-300 bg-brand-50 opacity-50 ring-2 ring-brand-200"
                    : "border-slate-200 bg-slate-50"
                } ${reordering ? "pointer-events-none" : ""}`}
                onMouseEnter={() => handleItemMouseEnter(equipment.id)}
              >
                <div
                  aria-hidden
                  className={`mt-1 shrink-0 transition-colors ${
                    isDragging
                      ? "cursor-grabbing text-brand-500"
                      : "cursor-grab text-slate-300 hover:text-brand-500"
                  }`}
                  onMouseDown={(e) => handleGripMouseDown(e, equipment.id)}
                >
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{equipment.nome}</p>
                      {equipment.observacoes ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">{equipment.observacoes}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={equipment.status === "operacional" ? "success" : "warm"}>
                        {equipment.status === "operacional" ? "Disponível" : "Em manutenção"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      disabled={updatingId === equipment.id || isDragging}
                      onClick={() => void handleToggle(equipment)}
                      type="button"
                      variant="secondary"
                    >
                      {updatingId === equipment.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : null}
                      {equipment.status === "operacional" ? "Marcar manutenção" : "Marcar disponível"}
                    </Button>
                    <Button
                      disabled={removingId === equipment.id || isDragging}
                      onClick={() => void handleRemove(equipment)}
                      type="button"
                      variant="ghost"
                    >
                      {removingId === equipment.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

"use client";

import { startTransition, useMemo, useState } from "react";
import { CalendarPlus2, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AvailabilitySlot } from "@/types";

interface AvailabilityManagerProps {
  slots: AvailabilitySlot[];
}

const initialState = {
  data: "",
  horaInicio: "",
  horaFim: ""
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function AvailabilityManager({
  slots
}: AvailabilityManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const orderedSlots = useMemo(
    () =>
      [...slots].sort((left, right) => {
        const dateCompare = left.data.localeCompare(right.data);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return left.horaInicio.localeCompare(right.horaInicio);
      }),
    [slots]
  );

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formState)
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao criar horário disponível.");
      }

      toast.success("Janela de disponibilidade publicada.");
      setFormState(initialState);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(availabilityId: string) {
    setUpdatingId(availabilityId);

    try {
      const response = await fetch(`/api/availability?availabilityId=${encodeURIComponent(availabilityId)}`, {
        method: "DELETE"
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao cancelar horário.");
      }

      toast.success("Horário cancelado.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao cancelar.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <Badge variant="brand">Disponibilidade</Badge>
        <CardTitle className="mt-4">Publique horários disponíveis do laboratório.</CardTitle>
        <CardDescription className="mt-3">
          Professores visualizam essas janelas e escolhem início e fim dentro do intervalo liberado.
        </CardDescription>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreate(event)}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="availability-date">Data</Label>
              <Input
                id="availability-date"
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, data: event.target.value }))
                }
                required
                type="date"
                value={formState.data}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability-start">Início</Label>
              <Input
                id="availability-start"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, horaInicio: event.target.value }))
                }
                required
                type="time"
                value={formState.horaInicio}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability-end">Fim</Label>
              <Input
                id="availability-end"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, horaFim: event.target.value }))
                }
                required
                type="time"
                value={formState.horaFim}
              />
            </div>
          </div>

          <Button disabled={saving} size="lg" type="submit">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarPlus2 className="h-4 w-4" />}
            Publicar horário
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Horários cadastrados</CardTitle>
        <CardDescription className="mt-3">
          Clique no X para cancelar e remover o horário da lista.
        </CardDescription>

        <div className="mt-6 space-y-3">
          {orderedSlots.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
              Nenhum horário disponível publicado ainda.
            </div>
          ) : (
            orderedSlots.map((slot) => (
              <div
                className="relative flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-5 pr-12 md:flex-row md:items-center md:justify-between md:pr-12"
                key={slot.id}
              >
                <button
                  aria-label="Cancelar horário"
                  className="absolute right-4 top-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                  disabled={updatingId === slot.id}
                  onClick={() => void handleRemove(slot.id)}
                  type="button"
                >
                  {updatingId === slot.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-950">Janela do laboratório</p>
                    <Badge variant={slot.ativo ? "success" : "neutral"}>
                      {slot.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(slot.data)} · {slot.horaInicio} - {slot.horaFim}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Publicado por {slot.criadoPorNome}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

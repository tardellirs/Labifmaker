"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookingDatePicker } from "@/components/booking/booking-date-picker";
import type { AvailabilitySlot, Equipment } from "@/types";

interface BookingRequestFormProps {
  equipmentCatalog: Equipment[];
  availabilitySlots: AvailabilitySlot[];
  trainingStatus: Record<string, boolean>;
}

const initialState = {
  equipamentoId: "",
  dataSolicitada: "",
  disponibilidadeId: "",
  horaInicio: "",
  horaFim: "",
  projeto: "",
  descricao: "",
  sabeOperarEquipamento: false,
  concordaTermos: false
};

export function BookingRequestForm({
  equipmentCatalog,
  availabilitySlots,
  trainingStatus
}: BookingRequestFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const availableEquipment = useMemo(
    () => equipmentCatalog.filter((equipment) => equipment.status !== "manutencao"),
    [equipmentCatalog]
  );

  useEffect(() => {
    if (formState.equipamentoId || availableEquipment.length === 0) return;
    setFormState((current) => ({
      ...current,
      equipamentoId: availableEquipment[0]?.id ?? ""
    }));
  }, [availableEquipment, formState.equipamentoId]);

  const selectedEquipment = useMemo(
    () => equipmentCatalog.find((equipment) => equipment.id === formState.equipamentoId),
    [equipmentCatalog, formState.equipamentoId]
  );

  const hasTraining = selectedEquipment ? trainingStatus[selectedEquipment.id] : false;
  const disabledByMaintenance = selectedEquipment?.status === "manutencao";

  const availableDates = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return new Set(
      availabilitySlots.filter((s) => s.ativo && s.data >= today).map((s) => s.data)
    );
  }, [availabilitySlots]);

  const slotsForDate = useMemo(
    () =>
      availabilitySlots
        .filter((s) => s.ativo && s.data === formState.dataSolicitada)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [availabilitySlots, formState.dataSolicitada]
  );

  const selectedSlot = useMemo(
    () => slotsForDate.find((s) => s.id === formState.disponibilidadeId),
    [slotsForDate, formState.disponibilidadeId]
  );

  const timeError = useMemo(() => {
    if (!selectedSlot || !formState.horaInicio || !formState.horaFim) return null;
    if (formState.horaInicio >= formState.horaFim)
      return "O horário de início deve ser anterior ao de fim.";
    if (formState.horaInicio < selectedSlot.horaInicio)
      return `Início antes da abertura do turno (${selectedSlot.horaInicio}).`;
    if (formState.horaFim > selectedSlot.horaFim)
      return `Saída após o encerramento do turno (${selectedSlot.horaFim}).`;
    return null;
  }, [formState.horaInicio, formState.horaFim, selectedSlot]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipamentoId: formState.equipamentoId,
          disponibilidadeId: formState.disponibilidadeId,
          dataSolicitada: formState.dataSolicitada,
          horaInicio: formState.horaInicio,
          horaFim: formState.horaFim,
          projeto: formState.projeto,
          descricao: formState.descricao,
          sabeOperarEquipamento: formState.sabeOperarEquipamento,
          concordaTermos: formState.concordaTermos
        })
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao criar o agendamento.");
      }

      toast.success("Solicitação enviada para a coordenação.");
      setFormState(initialState);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao enviar a solicitação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge variant="brand">Novo agendamento</Badge>
          <CardTitle className="mt-3">Solicite um horário de uso do laboratório.</CardTitle>
          <CardDescription className="mt-2 max-w-2xl">
            Preencha os dados essenciais do pedido e acompanhe o retorno da coordenação pelo portal.
          </CardDescription>
        </div>
        {selectedEquipment?.requerTreinamento ? (
          <Badge variant={hasTraining ? "success" : "warm"}>
            {hasTraining ? "Treinamento concluído" : "Treinamento pendente"}
          </Badge>
        ) : null}
      </div>

      <form className="mt-5 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        {/* Equipamento */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="equipamentoId">Equipamento</Label>
            <Select
              id="equipamentoId"
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  equipamentoId: event.target.value,
                  disponibilidadeId: "",
                  dataSolicitada: "",
                  horaInicio: "",
                  horaFim: ""
                }))
              }
              value={formState.equipamentoId}
            >
              <option value="">Selecione um equipamento</option>
              {equipmentCatalog.map((equipment) => (
                <option
                  disabled={equipment.status === "manutencao"}
                  key={equipment.id}
                  value={equipment.id}
                >
                  {equipment.nome}
                  {equipment.status === "manutencao" ? " (indisponível)" : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
              {selectedEquipment?.status === "manutencao" ? "Indisponível" : "Disponível"}
            </div>
          </div>
        </div>

        {selectedEquipment?.observacoes ? (
          <div className="rounded-[20px] border border-brand-100 bg-brand-50/70 p-3.5">
            <p className="text-sm leading-6 text-brand-700">{selectedEquipment.observacoes}</p>
          </div>
        ) : null}

        {disabledByMaintenance ? (
          <div className="flex items-start gap-3 rounded-[20px] border border-amber-200 bg-amber-50 p-3.5 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-6">
              Este equipamento está em manutenção. Novas solicitações ficam bloqueadas até que a
              coordenação o marque novamente como disponível.
            </p>
          </div>
        ) : null}

        {/* Passo 1 — Data + Passo 2 — Turno */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Passo 1 — Data</Label>
            <BookingDatePicker
              availableDates={availableDates}
              selected={formState.dataSolicitada}
              onSelect={(date) =>
                setFormState((c) => ({
                  ...c,
                  dataSolicitada: date,
                  disponibilidadeId: "",
                  horaInicio: "",
                  horaFim: ""
                }))
              }
            />
          </div>

          {formState.dataSolicitada ? (
            <div className="space-y-2">
              <Label>Passo 2 — Turno liberado</Label>
              {slotsForDate.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-3.5 text-sm text-slate-500">
                  Nenhum turno disponível para esta data. Peça para a coordenação publicar uma nova
                  janela.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {slotsForDate.map((slot, index) => (
                    <button
                      className={`rounded-[16px] border px-4 py-2.5 text-left text-sm transition ${
                        formState.disponibilidadeId === slot.id
                          ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-slate-50"
                      }`}
                      key={slot.id}
                      onClick={() =>
                        setFormState((c) => ({
                          ...c,
                          disponibilidadeId: slot.id,
                          horaInicio: "",
                          horaFim: ""
                        }))
                      }
                      type="button"
                    >
                      Turno {index + 1} — {slot.horaInicio} até {slot.horaFim}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Passo 3 — Horário exato */}
        {formState.disponibilidadeId ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Passo 3 — Seu horário de início</Label>
              <Input
                id="horaInicio"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, horaInicio: event.target.value }))
                }
                required
                type="time"
                value={formState.horaInicio}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Sua previsão de saída</Label>
              <Input
                id="horaFim"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, horaFim: event.target.value }))
                }
                required
                type="time"
                value={formState.horaFim}
              />
            </div>
            <label className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <Checkbox
                checked={formState.sabeOperarEquipamento}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    sabeOperarEquipamento: event.target.checked
                  }))
                }
              />
              Possuo conhecimento técnico para operar o equipamento.
            </label>
          </div>
        ) : null}

        {timeError ? (
          <div className="flex items-center gap-2 rounded-[16px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {timeError}
          </div>
        ) : null}

        {/* Projeto */}
        <div className="space-y-2">
          <Label htmlFor="projeto">Projeto</Label>
          <Input
            id="projeto"
            onChange={(event) =>
              setFormState((current) => ({ ...current, projeto: event.target.value }))
            }
            placeholder="Ex.: Protótipo para TCC"
            required
            value={formState.projeto}
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição da atividade</Label>
          <Textarea
            id="descricao"
            onChange={(event) =>
              setFormState((current) => ({ ...current, descricao: event.target.value }))
            }
            placeholder="Explique o objetivo do uso, o contexto acadêmico e o resultado esperado."
            required
            value={formState.descricao}
          />
        </div>

        {/* Termos */}
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3.5">
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <Checkbox
              checked={formState.concordaTermos}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  concordaTermos: event.target.checked
                }))
              }
              required
            />
            Declaro que li as regras básicas do laboratório e que as informações acima estão
            corretas.
          </label>
        </div>

        <Button
          disabled={
            disabledByMaintenance ||
            submitting ||
            !formState.equipamentoId ||
            !formState.disponibilidadeId ||
            !formState.horaInicio ||
            !formState.horaFim ||
            Boolean(timeError)
          }
          size="lg"
          type="submit"
        >
          {submitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Enviar solicitação
        </Button>
      </form>
    </Card>
  );
}

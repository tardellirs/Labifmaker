"use client";

import { startTransition, useEffect, useState } from "react";
import { Clock, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SLOT_MINUTES, expandRanges } from "@/lib/availability/compute";
import type { TimeRange, WeeklySchedule } from "@/types/operating-hours";

const WEEKDAYS = [
  { key: "1", label: "Segunda" },
  { key: "2", label: "Terça" },
  { key: "3", label: "Quarta" },
  { key: "4", label: "Quinta" },
  { key: "5", label: "Sexta" },
  { key: "6", label: "Sábado" },
  { key: "0", label: "Domingo" }
] as const;

interface OperatingHoursManagerProps {
  semana: WeeklySchedule;
  atualizadoPorNome?: string;
}

export function OperatingHoursManager({
  semana,
  atualizadoPorNome
}: OperatingHoursManagerProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<WeeklySchedule>(semana);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSchedule(semana);
  }, [semana]);

  function updateDay(weekday: string, ranges: TimeRange[]) {
    setSchedule((current) => ({ ...current, [weekday]: ranges }));
  }

  function addRange(weekday: string) {
    const current = schedule[weekday] ?? [];
    const last = current[current.length - 1];
    updateDay(weekday, [...current, last ? { inicio: last.fim, fim: last.fim } : { inicio: "08:00", fim: "17:00" }]);
  }

  async function handleSave() {
    setSaving(true);

    try {
      const response = await fetch("/api/operating-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semana: schedule })
      });
      const result = (await response.json()) as { error?: string; semana?: WeeklySchedule };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao salvar o horário de funcionamento.");
      }

      if (result.semana) {
        setSchedule(result.semana);
      }

      toast.success("Horário de funcionamento atualizado.");
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

  const totalBlocos = WEEKDAYS.reduce(
    (total, day) => total + expandRanges(schedule[day.key] ?? []).length,
    0
  );

  return (
    <Card>
      <Badge variant="brand">Funcionamento</Badge>
      <CardTitle className="mt-4">Horário de funcionamento do laboratório.</CardTitle>
      <CardDescription className="mt-3">
        Defina uma vez a janela semanal. Ela vale para todas as semanas, sem precisar publicar
        data por data. Os professores enxergam blocos de {SLOT_MINUTES} minutos dentro dessas
        faixas — e toda solicitação continua passando pela sua aprovação.
      </CardDescription>

      <div className="mt-6 space-y-3">
        {WEEKDAYS.map((day) => {
          const ranges = schedule[day.key] ?? [];

          return (
            <div
              className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
              key={day.key}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">{day.label}</p>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {ranges.length === 0
                      ? "Fechado"
                      : `${expandRanges(ranges).length} bloco(s) de ${SLOT_MINUTES} min`}
                  </span>
                  <Button onClick={() => addRange(day.key)} size="icon" type="button" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {ranges.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {ranges.map((range, index) => (
                    <div className="flex items-center gap-2" key={`${day.key}-${index}`}>
                      <Input
                        aria-label={`${day.label}: início da faixa ${index + 1}`}
                        className="max-w-[9rem]"
                        onChange={(event) =>
                          updateDay(
                            day.key,
                            ranges.map((item, position) =>
                              position === index ? { ...item, inicio: event.target.value } : item
                            )
                          )
                        }
                        type="time"
                        value={range.inicio}
                      />
                      <span className="text-sm text-slate-400">até</span>
                      <Input
                        aria-label={`${day.label}: fim da faixa ${index + 1}`}
                        className="max-w-[9rem]"
                        onChange={(event) =>
                          updateDay(
                            day.key,
                            ranges.map((item, position) =>
                              position === index ? { ...item, fim: event.target.value } : item
                            )
                          )
                        }
                        type="time"
                        value={range.fim}
                      />
                      <Button
                        aria-label={`Remover faixa ${index + 1} de ${day.label}`}
                        onClick={() =>
                          updateDay(
                            day.key,
                            ranges.filter((_, position) => position !== index)
                          )
                        }
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-4 w-4" />
          {totalBlocos} bloco(s) por semana
          {atualizadoPorNome ? ` · última alteração por ${atualizadoPorNome}` : ""}
        </p>

        <Button disabled={saving} onClick={() => void handleSave()} size="lg" type="button">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar funcionamento
        </Button>
      </div>
    </Card>
  );
}

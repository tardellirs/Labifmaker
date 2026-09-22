"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addDays, startOfWeek, todayIso, toMinutes } from "@/lib/availability/compute";
import { cn } from "@/lib/utils/cn";
import type { DaySlot } from "@/types/operating-hours";

interface ScheduleDay {
  data: string;
  diaSemana: number;
  fechado: boolean;
  blocos: DaySlot[];
}

interface WeekCalendarProps {
  equipamentoId: string;
  selecionado: { data: string; inicio: string; fim: string } | null;
  onSelect: (escolha: { data: string; inicio: string; fim: string }) => void;
}

const NOMES_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function rotuloDia(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function rotuloIntervalo(inicio: string, fim: string) {
  const [, mesI, diaI] = inicio.split("-");
  const [, mesF, diaF] = fim.split("-");
  return `${diaI}/${mesI} – ${diaF}/${mesF}`;
}

export function WeekCalendar({ equipamentoId, selecionado, onSelect }: WeekCalendarProps) {
  const hoje = todayIso();
  const [semanaRef, setSemanaRef] = useState(() => startOfWeek(hoje));
  const [dias, setDias] = useState<ScheduleDay[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!equipamentoId) {
      setDias([]);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch(
        `/api/schedule?equipamentoId=${encodeURIComponent(equipamentoId)}&data=${semanaRef}`,
        { cache: "no-store" }
      );
      const dados = (await resposta.json()) as { dias?: ScheduleDay[]; error?: string };

      if (!resposta.ok) throw new Error(dados.error ?? "Falha ao carregar a semana.");

      setDias(dados.dias ?? []);
    } catch (problema) {
      console.error(problema);
      setDias([]);
      setErro(problema instanceof Error ? problema.message : "Falha ao carregar a semana.");
    } finally {
      setCarregando(false);
    }
  }, [equipamentoId, semanaRef]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Só mostra fim de semana se o funcionamento abrir nesses dias.
  const diasVisiveis = useMemo(
    () => dias.filter((dia) => dia.diaSemana >= 1 && dia.diaSemana <= 5 || !dia.fechado),
    [dias]
  );

  // Linhas da grade: do primeiro ao último bloco da semana, com uma hora de folga.
  const horas = useMemo(() => {
    const todos = diasVisiveis.flatMap((dia) => dia.blocos);
    if (todos.length === 0) return [];

    const inicio = Math.min(...todos.map((bloco) => toMinutes(bloco.inicio)));
    const fim = Math.max(...todos.map((bloco) => toMinutes(bloco.fim)));

    const primeira = Math.max(0, Math.floor(inicio / 60) - 1);
    const ultima = Math.min(23, Math.ceil(fim / 60) + 1);

    return Array.from({ length: ultima - primeira }, (_, i) => primeira + i);
  }, [diasVisiveis]);

  const semanaAtual = semanaRef === startOfWeek(hoje);

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            aria-label="Semana anterior"
            disabled={semanaAtual}
            onClick={() => setSemanaRef((atual) => addDays(atual, -7))}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Próxima semana"
            onClick={() => setSemanaRef((atual) => addDays(atual, 7))}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="ml-1 text-sm font-medium text-slate-900">
            {dias.length > 0 ? rotuloIntervalo(dias[0].data, dias[dias.length - 1].data) : "—"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {carregando ? <LoaderCircle className="h-4 w-4 animate-spin text-brand-600" /> : null}
          {!semanaAtual ? (
            <Button onClick={() => setSemanaRef(startOfWeek(hoje))} size="default" type="button" variant="secondary">
              Hoje
            </Button>
          ) : null}
        </div>
      </div>

      {erro ? (
        <p className="mt-4 rounded-[16px] bg-rose-50 px-4 py-3 text-sm text-rose-800">{erro}</p>
      ) : null}

      {!erro && horas.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[34rem] gap-1"
            style={{ gridTemplateColumns: `3.5rem repeat(${diasVisiveis.length}, minmax(0, 1fr))` }}
          >
            <div aria-hidden />
            {diasVisiveis.map((dia) => (
              <div className="pb-1 text-center" key={`cab-${dia.data}`}>
                <p className="text-xs font-medium text-slate-900">{NOMES_CURTOS[dia.diaSemana]}</p>
                <p className={cn("text-[11px]", dia.data === hoje ? "font-semibold text-brand-600" : "text-slate-400")}>
                  {rotuloDia(dia.data)}
                </p>
              </div>
            ))}

            {horas.map((hora) => (
              <div className="contents" key={`linha-${hora}`}>
                <div className="pr-1 pt-1 text-right text-[11px] tabular-nums text-slate-400">
                  {String(hora).padStart(2, "0")}:00
                </div>

                {diasVisiveis.map((dia) => {
                  const bloco = dia.blocos.find((item) => toMinutes(item.inicio) === hora * 60);

                  if (!bloco) {
                    return <div className="h-9 rounded-md bg-slate-50" key={`${dia.data}-${hora}`} />;
                  }

                  const passado = dia.data < hoje;
                  const indisponivel = bloco.status === "ocupado" || passado;
                  const escolhido =
                    selecionado?.data === dia.data && selecionado?.inicio === bloco.inicio;

                  return (
                    <button
                      aria-label={`${NOMES_CURTOS[dia.diaSemana]} ${rotuloDia(dia.data)}, ${bloco.inicio} às ${bloco.fim}`}
                      aria-pressed={escolhido}
                      className={cn(
                        "h-9 rounded-md border text-[11px] font-medium transition",
                        escolhido
                          ? "border-brand-600 bg-brand-600 text-white"
                          : indisponivel
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : bloco.status === "pendente"
                              ? "border-dashed border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100"
                      )}
                      disabled={indisponivel}
                      key={`${dia.data}-${hora}`}
                      onClick={() => onSelect({ data: dia.data, inicio: bloco.inicio, fim: bloco.fim })}
                      title={
                        passado ? "Data passada"
                          : bloco.status === "ocupado" ? "Já reservado"
                          : bloco.status === "pendente" ? "Há uma solicitação aguardando aprovação" : "Disponível"
                      }
                      type="button"
                    >
                      {escolhido ? "Escolhido" : bloco.status === "ocupado" ? "Ocupado" : bloco.inicio}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!erro && horas.length === 0 && !carregando ? (
        <p className="mt-4 rounded-[16px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
          O laboratório não tem atendimento nesta semana. Use as setas para ver as próximas.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-brand-200 bg-brand-50" /> Disponível
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-dashed border-amber-400 bg-amber-50" /> Aguardando aprovação
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-slate-200 bg-slate-100" /> Indisponível
        </span>
      </div>
    </div>
  );
}

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
import { WeekCalendar } from "@/components/booking/week-calendar";
import { mergeContiguous } from "@/lib/availability/compute";
import type { SelectedBlock } from "@/lib/availability/compute";
import type { Equipment } from "@/types";

interface BookingRequestFormProps {
  equipmentCatalog: Equipment[];
  trainingStatus: Record<string, boolean>;
}

const initialState = {
  equipamentoId: "",
  projeto: "",
  descricao: "",
  sabeOperarEquipamento: false,
  concordaTermos: false
};

export function BookingRequestForm({
  equipmentCatalog,
  trainingStatus
}: BookingRequestFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(initialState);
  const [blocos, setBlocos] = useState<SelectedBlock[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Horas seguidas no mesmo dia viram um pedido so; dias distintos ficam separados.
  const pedidos = useMemo(() => mergeContiguous(blocos), [blocos]);

  function alternarBloco(bloco: SelectedBlock) {
    setBlocos((atuais) => {
      const jaTem = atuais.some(
        (item) => item.data === bloco.data && item.inicio === bloco.inicio
      );

      return jaTem
        ? atuais.filter((item) => !(item.data === bloco.data && item.inicio === bloco.inicio))
        : [...atuais, bloco];
    });
  }

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    // Um agendamento por intervalo, enviados em sequencia: assim a coordenacao
    // pode aprovar um dia e recusar outro. Se algum falhar, os que deram certo
    // permanecem e so os pendentes seguem marcados na grade.
    const falharam: SelectedBlock[] = [];
    let ultimoErro = "";

    for (const pedido of pedidos) {
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipamentoId: formState.equipamentoId,
            dataSolicitada: pedido.data,
            horaInicio: pedido.inicio,
            horaFim: pedido.fim,
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
      } catch (error) {
        console.error(error);
        falharam.push(pedido);
        ultimoErro = error instanceof Error ? error.message : "Falha ao enviar a solicitação.";
      }
    }

    const enviados = pedidos.length - falharam.length;

    if (enviados > 0) {
      toast.success(
        enviados === 1
          ? "Solicitação enviada para a coordenação."
          : `${enviados} solicitações enviadas para a coordenação.`
      );
    }

    if (falharam.length > 0) {
      toast.error(
        enviados > 0 ? `${falharam.length} não pôde ser enviada: ${ultimoErro}` : ultimoErro
      );
    }

    setBlocos((atuais) =>
      atuais.filter((bloco) =>
        falharam.some(
          (pedido) =>
            pedido.data === bloco.data &&
            pedido.inicio <= bloco.inicio &&
            pedido.fim >= bloco.fim
        )
      )
    );

    if (falharam.length === 0) {
      setFormState((current) => ({ ...initialState, equipamentoId: current.equipamentoId }));
    }

    setSubmitting(false);
    startTransition(() => router.refresh());
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
              onChange={(event) => {
                setBlocos([]);
                setFormState((current) => ({ ...current, equipamentoId: event.target.value }));
              }}
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

        {/* Escolha do horário na grade semanal */}
        <div className="space-y-2">
          <Label>Escolha o horário</Label>
          <WeekCalendar
            equipamentoId={formState.equipamentoId}
            onToggle={alternarBloco}
            selecionados={blocos}
          />
        </div>

        {pedidos.length > 0 ? (
          <div className="rounded-[20px] border border-brand-200 bg-brand-50 px-4 py-3">
            <p className="text-sm font-medium text-brand-900">
              {pedidos.length === 1 ? "1 horário escolhido" : `${pedidos.length} horários escolhidos`}
            </p>
            <ul className="mt-2 space-y-1">
              {pedidos.map((pedido) => {
                const [ano, mes, dia] = pedido.data.split("-");

                return (
                  <li
                    className="flex items-center justify-between gap-3 text-sm text-brand-800"
                    key={`${pedido.data}-${pedido.inicio}`}
                  >
                    <span>
                      {dia}/{mes}/{ano} · {pedido.inicio} às {pedido.fim}
                    </span>
                    <button
                      className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900"
                      onClick={() =>
                        setBlocos((atuais) =>
                          atuais.filter(
                            (bloco) =>
                              !(
                                bloco.data === pedido.data &&
                                bloco.inicio >= pedido.inicio &&
                                bloco.fim <= pedido.fim
                              )
                          )
                        )
                      }
                      type="button"
                    >
                      remover
                    </button>
                  </li>
                );
              })}
            </ul>
            {pedidos.length > 1 ? (
              <p className="mt-2 text-xs text-brand-700">
                Cada horário vira uma solicitação separada, avaliada individualmente pela
                coordenação.
              </p>
            ) : null}
          </div>
        ) : null}

        {blocos.length > 0 ? (
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
            pedidos.length === 0
          }
          size="lg"
          type="submit"
        >
          {submitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {pedidos.length > 1 ? `Enviar ${pedidos.length} solicitações` : "Enviar solicitação"}
        </Button>
      </form>
    </Card>
  );
}

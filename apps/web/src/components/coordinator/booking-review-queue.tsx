"use client";

import { startTransition, useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle, MessageSquareText, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { Booking } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface BookingReviewQueueProps {
  bookings: Booking[];
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatDetailLabel(rawKey: string) {
  return rawKey
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

function formatDetailValue(value: string | number | boolean | null | undefined) {
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  return String(value ?? "-");
}

export function BookingReviewQueue({ bookings }: BookingReviewQueueProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const highlightedBookingId = searchParams.get("booking");

  const pendingBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "pendente")
        .sort((left, right) => (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0)),
    [bookings]
  );

  function getDecisionNote(bookingId: string) {
    return decisionNotes[bookingId] ?? "";
  }

  async function submitDecision(bookingId: string, decision: "aprovado" | "rejeitado") {
    setUpdatingId(bookingId);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          decision,
          justificativa: getDecisionNote(bookingId).trim() || undefined
        })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao avaliar o agendamento.");
      }

      toast.success(
        decision === "aprovado"
          ? "Agendamento aprovado e professor notificado."
          : "Agendamento reprovado e professor notificado."
      );
      setRejectingBooking(null);
      setDecisionNotes((current) => ({ ...current, [bookingId]: "" }));
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao avaliar o pedido.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="brand">Fila de aprovação</Badge>
            <CardTitle className="mt-4">Avalie as solicitações dos professores.</CardTitle>
            <CardDescription className="mt-3">
              Escreva um comentário opcional, aprove ou reprove o pedido e o professor será avisado por e-mail.
            </CardDescription>
          </div>
          <div className="rounded-[22px] bg-brand-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Pendentes</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {String(pendingBookings.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {pendingBookings.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
              Nenhum pedido pendente no momento. As próximas solicitações de professores aparecerão aqui.
            </div>
          ) : (
            pendingBookings.map((booking) => (
              <div
                className={`rounded-[26px] border p-5 transition ${
                  highlightedBookingId === booking.id
                    ? "border-brand-300 bg-brand-50/40 shadow-ambient"
                    : "border-slate-200 bg-slate-50"
                }`}
                id={`booking-${booking.id}`}
                key={booking.id}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-slate-950">{booking.projeto}</p>
                      <Badge variant="warm">Pendente</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{booking.equipamentoNome}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(booking.dataSolicitada)} · {booking.horaInicio} - {booking.horaFim}
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{booking.solicitanteNome}</p>
                    <p>{booking.solicitanteEmail}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Descrição da atividade</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{booking.descricao}</p>
                    <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      {booking.sabeOperarEquipamento
                        ? "Professor informou que sabe utilizar o equipamento com autonomia."
                        : "Professor informou que precisa de apoio para utilizar o equipamento."}
                    </div>
                  </div>

                  {Object.keys(booking.detalhesTecnicos).length > 0 ? (
                    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-900">Detalhes técnicos</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {Object.entries(booking.detalhesTecnicos).map(([key, value]) => (
                          <div className="flex items-start justify-between gap-4" key={key}>
                            <span className="text-slate-500">{formatDetailLabel(key)}</span>
                            <span className="text-right text-slate-900">
                              {formatDetailValue(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-brand-600" />
                    <p className="text-sm font-medium text-slate-900">Comentário da coordenação</p>
                  </div>
                  <Textarea
                    className="mt-3 min-h-24"
                    onChange={(event) =>
                      setDecisionNotes((current) => ({
                        ...current,
                        [booking.id]: event.target.value
                      }))
                    }
                    placeholder="Opcional: registre observações que também serão enviadas ao professor."
                    value={getDecisionNote(booking.id)}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    disabled={updatingId === booking.id}
                    onClick={() => void submitDecision(booking.id, "aprovado")}
                    type="button"
                  >
                    {updatingId === booking.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    disabled={updatingId === booking.id}
                    onClick={() => {
                      setRejectingBooking(booking);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    <XCircle className="h-4 w-4" />
                    Reprovar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setRejectingBooking(null);
          }
        }}
        open={Boolean(rejectingBooking)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reprovação</DialogTitle>
            <DialogDescription>
              Deseja mesmo reprovar esta solicitação? O professor será avisado por e-mail.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-950">{rejectingBooking?.projeto}</p>
              <p className="mt-1">
                {rejectingBooking?.solicitanteNome} · {rejectingBooking?.equipamentoNome}
              </p>
              {rejectingBooking ? (
                <p className="mt-2 text-slate-500">
                  {formatDate(rejectingBooking.dataSolicitada)} · {rejectingBooking.horaInicio} - {rejectingBooking.horaFim}
                </p>
              ) : null}
            </div>

            {rejectingBooking && getDecisionNote(rejectingBooking.id).trim() ? (
              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <span className="font-medium text-slate-900">Comentário que será enviado:</span>{" "}
                {getDecisionNote(rejectingBooking.id).trim()}
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Nenhum comentário foi preenchido. A reprovação será enviada sem observações adicionais.
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                onClick={() => {
                  setRejectingBooking(null);
                }}
                type="button"
                variant="ghost"
              >
                Cancelar
              </Button>
              <Button
                disabled={!rejectingBooking || updatingId === rejectingBooking.id}
                onClick={() => {
                  if (!rejectingBooking) {
                    return;
                  }

                  void submitDecision(rejectingBooking.id, "rejeitado");
                }}
                type="button"
                variant="secondary"
              >
                {rejectingBooking && updatingId === rejectingBooking.id ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirmar reprovação
              </Button>
            </div>
          </div>
      </DialogContent>
      </Dialog>
    </>
  );
}

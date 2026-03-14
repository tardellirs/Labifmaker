"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronDown, ClipboardCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

import type { Booking } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface ApprovedBookingsArchiveProps {
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

export function ApprovedBookingsArchive({ bookings }: ApprovedBookingsArchiveProps) {
  const searchParams = useSearchParams();
  const highlightedBookingId = searchParams.get("booking");
  const approvedBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "aprovado")
        .sort((left, right) => (right.avaliadoEm?.getTime() ?? 0) - (left.avaliadoEm?.getTime() ?? 0)),
    [bookings]
  );

  return (
    <Card>
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-brand-600" />
        <CardTitle>Aprovados salvos no site</CardTitle>
      </div>
      <CardDescription className="mt-3">
        Histórico detalhado dos agendamentos aprovados, preservado para consulta da coordenação.
      </CardDescription>

          <div className="mt-6 space-y-3">
        {approvedBookings.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
            Nenhum agendamento aprovado ainda.
          </div>
        ) : (
          approvedBookings.map((booking) => (
            <details
              className={`group rounded-[22px] border ${
                highlightedBookingId === booking.id
                  ? "border-brand-300 bg-brand-50/40"
                  : "border-slate-200 bg-slate-50"
              }`}
              id={`booking-${booking.id}`}
              key={booking.id}
              open={highlightedBookingId === booking.id}
            >
              <summary className="cursor-pointer list-none px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{booking.projeto}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.solicitanteNome} · {booking.equipamentoNome}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(booking.dataSolicitada)} · {booking.horaInicio} - {booking.horaFim}
                    </p>
                  </div>
                  <Badge variant="success">Aprovado</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <span>Detalhes</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:-rotate-180" />
                </div>
              </summary>

              <div className="border-t border-slate-200 px-4 py-4">
                <p className="text-sm leading-6 text-slate-600">{booking.descricao}</p>

                {Object.keys(booking.detalhesTecnicos).length > 0 ? (
                  <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-900">Detalhes técnicos</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {Object.entries(booking.detalhesTecnicos).map(([key, value]) => (
                        <div className="flex items-start justify-between gap-4" key={key}>
                          <span className="text-slate-500">{formatDetailLabel(key)}</span>
                          <span className="text-right text-slate-900">{formatDetailValue(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {booking.justificativa ? (
                  <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Comentário da coordenação: {booking.justificativa}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {booking.avaliadorNome ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Avaliado por {booking.avaliadorNome}
                    </p>
                  ) : null}
                  {booking.googleCalendarHtmlLink ? (
                    <a
                      className="text-xs font-medium text-brand-700 transition hover:text-brand-900"
                      href={booking.googleCalendarHtmlLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Abrir no Google Calendar
                    </a>
                  ) : null}
                  <Link
                    className="text-xs font-medium text-slate-600 transition hover:text-slate-900"
                    href={`/coordenacao/aprovados?booking=${booking.id}#booking-${booking.id}` as Route}
                  >
                    Abrir detalhe
                  </Link>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </Card>
  );
}

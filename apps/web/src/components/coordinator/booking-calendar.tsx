"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import type { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface BookingCalendarProps {
  bookings: Booking[];
}

type CalendarView = "month" | "week";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function parseDate(rawDate: string) {
  const [year, month, day] = rawDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = normalized.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + offset);
  return normalized;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short"
  }).format(date);
}

function formatWeekdayWithDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function formatDayNumber(date: Date) {
  return String(date.getDate());
}

function buildMonthGrid(cursorDate: Date) {
  const firstDay = startOfMonth(cursorDate);
  const gridStart = startOfWeek(firstDay);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function buildWeekDays(cursorDate: Date) {
  const weekStart = startOfWeek(cursorDate);

  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function getEventStyles(status: Booking["status"]) {
  return status === "aprovado"
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-amber-200 bg-amber-50 text-amber-900";
}

function getBookingHref(booking: Booking) {
  const basePath =
    booking.status === "aprovado" ? "/coordenacao/aprovados" : "/coordenacao/solicitacoes";

  return `${basePath}?booking=${booking.id}#booking-${booking.id}` as Route;
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const [view, setView] = useState<CalendarView>("month");
  const [cursorDate, setCursorDate] = useState(() => new Date());

  const visibleBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "pendente" || booking.status === "aprovado")
        .sort((left, right) => {
          const dateCompare = left.dataSolicitada.localeCompare(right.dataSolicitada);
          if (dateCompare !== 0) {
            return dateCompare;
          }

          return left.horaInicio.localeCompare(right.horaInicio);
        }),
    [bookings]
  );

  const monthDays = useMemo(() => buildMonthGrid(cursorDate), [cursorDate]);
  const weekDays = useMemo(() => buildWeekDays(cursorDate), [cursorDate]);

  function bookingsForDate(date: Date) {
    return visibleBookings.filter((booking) => sameDay(parseDate(booking.dataSolicitada), date));
  }

  function moveCursor(direction: "previous" | "next") {
    setCursorDate((current) => {
      const next = new Date(current);

      if (view === "month") {
        next.setMonth(next.getMonth() + (direction === "next" ? 1 : -1));
        return next;
      }

      next.setDate(next.getDate() + (direction === "next" ? 7 : -7));
      return next;
    });
  }

  return (
    <Card className="overflow-hidden p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-brand-600" />
          <CardTitle className="text-sm">Agenda da coordenação</CardTitle>
          <p className="text-sm font-semibold capitalize text-slate-500">
            — {view === "month"
              ? formatMonthLabel(cursorDate)
              : `${formatWeekdayWithDate(weekDays[0])} - ${formatWeekdayWithDate(weekDays[6])}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Pendente
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Aprovado
            </span>
          </div>

          <div className="rounded-full border border-slate-200 bg-slate-50 p-0.5">
            <Button
              className="h-7 px-2.5 text-xs"
              onClick={() => setView("month")}
              type="button"
              variant={view === "month" ? "primary" : "ghost"}
            >
              Mês
            </Button>
            <Button
              className="h-7 px-2.5 text-xs"
              onClick={() => setView("week")}
              type="button"
              variant={view === "week" ? "primary" : "ghost"}
            >
              Semana
            </Button>
          </div>

          <div className="flex items-center rounded-full border border-slate-200 bg-white px-0.5 py-0.5">
            <Button onClick={() => moveCursor("previous")} size="icon" type="button" variant="ghost" className="h-7 w-7">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={() => setCursorDate(new Date())} type="button" variant="ghost" className="h-7 px-2 text-xs">
              Hoje
            </Button>
            <Button onClick={() => moveCursor("next")} size="icon" type="button" variant="ghost" className="h-7 w-7">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {view === "month" ? (
        <div className="mt-2 overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-7 border border-slate-200">
            {WEEKDAY_LABELS.map((label) => (
              <div
                className="border-b border-r border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 last:border-r-0"
                key={label}
              >
                {label}
              </div>
            ))}

            {monthDays.map((day) => {
              const dayBookings = bookingsForDate(day);
              const isCurrentMonth = day.getMonth() === cursorDate.getMonth();
              const isToday = sameDay(day, new Date());
              const visibleDayBookings = dayBookings.slice(0, 2);
              const remaining = dayBookings.length - visibleDayBookings.length;

              return (
                <div
                  className={`min-h-16 border-b border-r border-slate-200 p-1 last:border-r-0 ${
                    isCurrentMonth ? "bg-white" : "bg-slate-50/70"
                  }`}
                  key={day.toISOString()}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        isToday
                          ? "bg-brand-600 text-white"
                          : isCurrentMonth
                            ? "text-slate-900"
                            : "text-slate-400"
                      }`}
                    >
                      {formatDayNumber(day)}
                    </span>
                    {dayBookings.length > 0 ? (
                      <span className="text-[10px] text-slate-400">{dayBookings.length}</span>
                    ) : null}
                  </div>

                  <div className="space-y-0.5">
                    {visibleDayBookings.map((booking) => (
                      <Link
                        className={`block truncate rounded border px-1 py-0.5 text-[10px] font-medium transition hover:opacity-80 ${getEventStyles(
                          booking.status
                        )}`}
                        href={getBookingHref(booking)}
                        key={booking.id}
                        title={`${booking.horaInicio}-${booking.horaFim} · ${booking.equipamentoNome} · ${booking.solicitanteNome}`}
                      >
                        {booking.horaInicio} {booking.equipamentoNome}
                      </Link>
                    ))}
                    {remaining > 0 ? (
                      <div className="px-1 text-[10px] font-medium text-slate-500">
                        +{remaining}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dayBookings = bookingsForDate(day);
              const isToday = sameDay(day, new Date());

              return (
                <div className="rounded-[14px] border border-slate-200 bg-white" key={day.toISOString()}>
                  <div className="border-b border-slate-200 px-2 py-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                      {formatWeekday(day)}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-950">{formatDayNumber(day)}</p>
                      {isToday ? (
                        <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
                          Hoje
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1 px-1.5 py-1.5">
                    {dayBookings.length === 0 ? (
                      <div className="rounded border border-dashed border-slate-200 px-1 py-1.5 text-center text-[10px] text-slate-400">
                        Livre
                      </div>
                    ) : (
                      dayBookings.map((booking) => (
                        <Link
                          className={`block rounded border px-1.5 py-1 text-[10px] transition hover:opacity-80 ${getEventStyles(
                            booking.status
                          )}`}
                          href={getBookingHref(booking)}
                          key={booking.id}
                        >
                          <p className="font-semibold">
                            {booking.horaInicio} - {booking.horaFim}
                          </p>
                          <p className="truncate opacity-80">{booking.equipamentoNome}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

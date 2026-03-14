"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface BookingDatePickerProps {
  availableDates: Set<string>;
  selected: string;
  onSelect: (date: string) => void;
}

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const gridStart = startOfWeekMonday(firstDay);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, month)
  );
}

function formatSelectedDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function BookingDatePicker({ availableDates, selected, onSelect }: BookingDatePickerProps) {
  const today = useMemo(() => toISODate(new Date()), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const initialMonthState = useMemo(() => {
    const firstFuture = [...availableDates].filter((d) => d >= today).sort()[0];
    if (firstFuture) {
      const [y, m] = firstFuture.split("-").map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [availableDates, today]);

  const [year, setYear] = useState(initialMonthState.year);
  const [month, setMonth] = useState(initialMonthState.month);

  const days = useMemo(() => buildMonthGrid(year, month), [year, month]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function movePrev() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function moveNext() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function handleSelect(iso: string) {
    onSelect(iso);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        className={`flex h-11 w-full items-center gap-2.5 rounded-2xl border px-4 text-sm transition ${
          selected
            ? "border-brand-300 bg-brand-50 font-medium text-brand-800"
            : "border-slate-200 bg-white text-slate-400"
        } hover:border-brand-300`}
        onClick={() => setIsOpen((o) => !o)}
        type="button"
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        {selected ? formatSelectedDate(selected) : "Selecione uma data"}
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-12 z-20 w-72 rounded-[20px] border border-slate-200 bg-white p-3 shadow-ambient">
          <div className="mb-2 flex items-center justify-between">
            <button
              aria-label="Mês anterior"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              onClick={movePrev}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold capitalize text-slate-900">
              {formatMonthLabel(year, month)}
            </p>
            <button
              aria-label="Próximo mês"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              onClick={moveNext}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAY_LABELS.map((label) => (
              <div
                className="py-1 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400"
                key={label}
              >
                {label}
              </div>
            ))}

            {days.map((day) => {
              const iso = toISODate(day);
              const isCurrentMonth = day.getMonth() === month;
              const isPast = iso < today;
              const isAvailable = availableDates.has(iso);
              const isSelected = iso === selected;
              const isToday = iso === today;
              const isDisabled = !isCurrentMonth || isPast || !isAvailable;

              let cls =
                "mx-auto flex h-7 w-7 select-none items-center justify-center rounded-full text-xs transition ";

              if (!isCurrentMonth) {
                cls += "cursor-default text-transparent";
              } else if (isSelected) {
                cls += "cursor-pointer bg-brand-600 font-semibold text-white";
              } else if (isDisabled) {
                cls += "cursor-default text-slate-300";
              } else {
                cls +=
                  "cursor-pointer font-medium text-slate-900 hover:bg-brand-50 hover:text-brand-700";
                if (isToday) cls += " ring-1 ring-brand-400";
              }

              return (
                <div className="flex items-center justify-center py-0.5" key={iso}>
                  <button
                    className={cls}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelect(iso)}
                    tabIndex={isDisabled ? -1 : 0}
                    type="button"
                  >
                    {isCurrentMonth ? day.getDate() : ""}
                  </button>
                </div>
              );
            })}
          </div>

          {[...availableDates].filter((d) => d >= today).length === 0 ? (
            <p className="mt-2 text-center text-xs text-slate-400">
              Nenhuma data disponível no momento.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

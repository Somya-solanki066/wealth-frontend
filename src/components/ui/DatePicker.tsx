"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseIso(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDisplay(value?: string) {
  const d = parseIso(value);
  if (!d) return "";
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

type DatePickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  /** student blue or gold */
  accent?: "blue" | "gold";
};

export default function DatePicker({
  label,
  value,
  onChange,
  error,
  placeholder = "dd-mm-yyyy",
  className = "",
  accent = "blue",
}: DatePickerProps) {
  const accentColor = accent === "gold" ? "var(--gd)" : "#5298E0";
  const accentSoft =
    accent === "gold" ? "rgba(201,168,76,0.15)" : "rgba(82,152,224,0.15)";
  const accentBorder =
    accent === "gold" ? "rgba(122,94,30,0.5)" : "rgba(82,152,224,0.4)";

  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = parseIso(value);
  const initialMonth = selected || new Date();
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());

  useEffect(() => {
    if (!open) return;
    const d = parseIso(value) || new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: ({ day: number; iso: string } | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, iso: `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}` });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const todayIso = toIso(new Date());

  return (
    <div className={`space-y-1.5 w-full ${className}`} ref={rootRef}>
      {label ? (
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#909090] select-none">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-[#161616] px-3.5 py-2.5 text-left text-xs transition-all duration-200 focus:outline-none focus:ring-2 ${
            error ? "border-red-500/50" : "border-[#242424]"
          } ${open ? "ring-2" : ""}`}
          style={
            open
              ? {
                  borderColor: accentColor,
                  boxShadow: `0 0 0 2px ${accentSoft}`,
                }
              : undefined
          }
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={value ? "text-[#F0EBE0]" : "text-[#606060]"}>
            {value ? formatDisplay(value) : placeholder}
          </span>
          <Calendar className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
        </button>

        {open ? (
          <div
            className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-[#242424] bg-[#141414] p-3 shadow-2xl shadow-black/50"
            role="dialog"
            aria-label="Choose date"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#242424] bg-[#1c1c1c] text-[#F0EBE0] hover:border-[#5298E0]/50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-xs font-bold text-white">
                {MONTHS[viewMonth]} {viewYear}
              </p>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#242424] bg-[#1c1c1c] text-[#F0EBE0] hover:border-[#5298E0]/50"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-[#606060]"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((cell, idx) => {
                if (!cell) {
                  return <div key={`e-${idx}`} className="h-9" />;
                }
                const isSelected = value === cell.iso;
                const isToday = cell.iso === todayIso;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      onChange(cell.iso);
                      setOpen(false);
                    }}
                    className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected
                        ? "text-white"
                        : isToday
                          ? "text-[#F0EBE0]"
                          : "text-[#909090] hover:bg-[#1c1c1c] hover:text-white"
                    }`}
                    style={
                      isSelected
                        ? { background: accentColor, color: "#fff" }
                        : isToday
                          ? {
                              boxShadow: `inset 0 0 0 1px ${accentBorder}`,
                              background: accentSoft,
                            }
                          : undefined
                    }
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#242424] pt-3">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-[11px] font-semibold text-[#909090] hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(todayIso);
                  setOpen(false);
                }}
                className="text-[11px] font-semibold"
                style={{ color: accentColor }}
              >
                Today
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-1 text-[10px] text-red-400 select-none">{error}</p> : null}
    </div>
  );
}

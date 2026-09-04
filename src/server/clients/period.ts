import type { PeriodPreset } from "@/modules/clientes/constants";
import type { PeriodRange } from "@/modules/clientes/types";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Resolve um preset de período (etapa 5) para um intervalo de datas concreto. */
export function resolvePeriod(
  preset: PeriodPreset,
  custom?: { start?: string | Date | null; end?: string | Date | null },
): PeriodRange {
  const today = new Date();

  switch (preset) {
    case "hoje":
      return { start: startOfDay(today), end: endOfDay(today) };
    case "7dias": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: startOfDay(start), end: endOfDay(today) };
    }
    case "30dias": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: startOfDay(start), end: endOfDay(today) };
    }
    case "este_mes": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: startOfDay(start), end: endOfDay(today) };
    }
    case "mes_anterior": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "personalizado": {
      const start = custom?.start ? new Date(custom.start) : new Date(today.getFullYear(), today.getMonth(), 1);
      const end = custom?.end ? new Date(custom.end) : today;
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    default:
      return { start: startOfDay(today), end: endOfDay(today) };
  }
}

import type { DashboardMetric } from "./types";

export const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatMetric = (metric: DashboardMetric) => {
  if (metric.format === "currency") {
    return formatCurrency(metric.value || 0);
  }

  if (metric.format === "duration") {
    if (metric.value === null) {
      return "Sin dato";
    }

    if (metric.value < 60) {
      return `${metric.value}s`;
    }

    return `${Math.round(metric.value / 60)} min`;
  }

  return String(metric.value ?? 0);
};

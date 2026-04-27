import type { DashboardLead } from "./types";

export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  received: {
    label: "Recibido",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  scheduled: {
    label: "Rellamada programada",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  queued: {
    label: "En cola",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  dispatching: {
    label: "Llamando",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  queue_dispatching: {
    label: "Llamando",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  agent_call_stale: {
    label: "Intento vencido",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  dialing_agent: {
    label: "Llamando asesora",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  waiting_agent_confirmation: {
    label: "Esperando confirmacion",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  connecting_customer: {
    label: "Conectando paciente",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  customer_connected: {
    label: "Contactado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  completed: {
    label: "Completada",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  payment_confirmed: {
    label: "Pago confirmado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  payment_pending: {
    label: "Pago pendiente",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  callback_requested: {
    label: "Rellamada programada",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  missed: {
    label: "No contestó",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  customer_unreachable: {
    label: "No contactable",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  agent_unreachable: {
    label: "Asesora no contesto",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  no_agent_available: {
    label: "Sin asesora",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  failed: {
    label: "Error",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  exhausted: {
    label: "Sin intentos",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  prompting: {
    label: "Confirmando",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  initiated: {
    label: "Llamando",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  ringing: {
    label: "Sonando",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  answered: {
    label: "Contestó",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  "in-progress": {
    label: "En llamada",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
};

const FALLBACK_STATUS_CLASSNAME = "border-slate-200 bg-slate-50 text-slate-700";
const PENDING_AGENT_STATUSES = new Set(["dialing_agent", "waiting_agent_confirmation"]);
const PENDING_CALL_STALE_MS = 2 * 60 * 1000;

const humanizeStatus = (status: string) =>
  status
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Sin estado";

export const getLeadStatus = (
  lead: Pick<DashboardLead, "createdAt" | "updatedAt" | "status" | "customerConnectedAt" | "lastError">,
) => {
  const updatedAt = Date.parse(lead.updatedAt || lead.createdAt || "");
  const isStaleAgentCall =
    PENDING_AGENT_STATUSES.has(lead.status) &&
    Number.isFinite(updatedAt) &&
    Date.now() - updatedAt > PENDING_CALL_STALE_MS;
  const statusKey =
    isStaleAgentCall
      ? "agent_call_stale"
      : lead.customerConnectedAt && ["received", "scheduled", "dispatching", "connecting_customer"].includes(lead.status)
      ? "customer_connected"
      : lead.status;

  return STATUS_LABELS[statusKey] || {
    label: lead.lastError ? "Atención" : humanizeStatus(statusKey),
    className: lead.lastError ? STATUS_LABELS.failed.className : FALLBACK_STATUS_CLASSNAME,
  };
};

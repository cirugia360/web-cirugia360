import {
  AlertCircle,
  ArrowUpDown,
  BarChart3,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  GitBranch,
  GripVertical,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  MessageCircle,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings,
  Stethoscope,
  Target,
  User,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import {
  getDashboardSupabase,
  getDashboardSupabaseConfigError,
  subscribeDashboardSession,
} from "@/lib/dashboardSupabase";
import { LoginPanel } from "./cirugia360/components/LoginPanel";
import { LeadStatusBadge } from "./cirugia360/components/LeadStatusBadge";
import { MetricTile } from "./cirugia360/components/MetricTile";
import { apiRequest, getDashboardErrorMessage, isSessionExpiredError } from "./cirugia360/lib/api";
import { formatCurrency, formatMetric } from "./cirugia360/lib/format";
import { getLeadStatus } from "./cirugia360/lib/status";
import type {
  ActionOptions,
  AgentSettings,
  CreateLeadPayload,
  DashboardLead,
  DashboardMetric,
  DashboardPeriod,
  DashboardSnapshot,
  LeadCallResult,
  LeadNote,
  LeadSortKey,
  LossReasonCode,
  PipelineStage,
  RefreshOptions,
  SortDirection,
  ToastTone,
} from "./cirugia360/lib/types";

const navItems = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "attribution", label: "Atribucion", icon: GitBranch },
  { id: "pipeline", label: "Pipeline", icon: Target },
  { id: "leads", label: "Leads", icon: Users },
  { id: "team", label: "Equipo", icon: Settings },
];

const roleVisibleNavItems = (role: "admin" | "agent") =>
  role === "admin" ? navItems : navItems.filter((item) => ["pipeline", "leads"].includes(item.id));

const periodOptions: Array<{ id: DashboardPeriod; label: string }> = [
  { id: "today", label: "Hoy" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "month", label: "Mes" },
  { id: "custom", label: "Custom" },
];

const businessTimeZoneOptions = [
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Lima",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
];

const emptyTeamSettings: AgentSettings = {
  businessTimeZone: "America/Santiago",
  queuePaused: false,
  agents: [],
};

const serializeTeamSettings = (value: AgentSettings | null) => JSON.stringify(value || emptyTeamSettings);

const lossReasonOptions: Array<{ id: LossReasonCode; label: string }> = [
  { id: "no_responde", label: "No responde" },
  { id: "precio", label: "Precio" },
  { id: "no_califica_medicamente", label: "No califica médicamente" },
  { id: "eligio_otra_clinica", label: "Eligió otra clínica" },
  { id: "otro", label: "Otro" },
];

const getLossReasonLabel = (reasonCode: string | null) =>
  lossReasonOptions.find((option) => option.id === reasonCode)?.label || "";

const isValidAgentPhone = (value: string) => {
  const compactValue = value.replace(/[^\d+]/g, "");

  return /^\+?\d{8,15}$/.test(compactValue);
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const getDashboardDateRange = (
  period: DashboardPeriod,
  customRange: { dateFrom: string; dateTo: string },
) => {
  const today = new Date();
  const end = endOfDay(today);
  const start = startOfDay(today);

  if (period === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (period === "30d") {
    start.setDate(start.getDate() - 29);
  } else if (period === "month") {
    start.setDate(1);
  } else if (period === "custom") {
    const customStart = customRange.dateFrom ? startOfDay(new Date(`${customRange.dateFrom}T00:00:00`)) : null;
    const customEnd = customRange.dateTo ? endOfDay(new Date(`${customRange.dateTo}T00:00:00`)) : null;

    return {
      dateFrom: customStart?.toISOString() || null,
      dateTo: customEnd?.toISOString() || null,
      label:
        customRange.dateFrom || customRange.dateTo
          ? `${customRange.dateFrom || "Inicio"} - ${customRange.dateTo || "Hoy"}`
          : "Custom",
    };
  }

  return {
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
    label:
      period === "today"
        ? "Hoy"
        : `${toDateInputValue(start)} - ${toDateInputValue(end)}`,
  };
};

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Sin dato";

const toDateTimeLocalValue = (value: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const dateTimeLocalToIso = (value: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const showActionToast = (tone: ToastTone, title: string, description?: string) => {
  const options = {
    description,
    duration: 4000,
  };

  if (tone === "success") {
    toast.success(title, options);
    return;
  }

  if (tone === "warning") {
    toast.warning(title, options);
    return;
  }

  toast.error(title, options);
};

class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-dashboard-page px-4 text-dashboard-ink">
          <section className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <h1 className="text-lg font-bold">No pudimos renderizar el dashboard</h1>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Recarga el dashboard. Si vuelve a ocurrir, contacta soporte con la hora del error.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-dashboard-primary px-3 py-2 text-sm font-bold text-white"
                onClick={() => window.location.reload()}
              >
                Recargar dashboard
              </button>
              <a
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-dashboard-muted"
                href="mailto:soporte@cirugia360.cl"
              >
                Contactar soporte
              </a>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

const buildSpeedMetrics = (leads: DashboardLead[]): DashboardMetric[] => {
  const connected = leads.filter((lead) => lead.customerConnectedAt).length;
  const completed = leads.filter((lead) => lead.status === "completed").length;
  const queued = leads.filter((lead) => ["scheduled", "dispatching"].includes(lead.status)).length;
  const lost = leads.filter((lead) => lead.pipelineOutcome === "lost").length;
  const won = leads.filter((lead) => lead.pipelineOutcome === "won").length;
  const totalPipelineValue = leads.reduce((sum, lead) => sum + Number(lead.pipelineValue || 0), 0);

  return [
    { id: "total", label: "Leads", value: leads.length, tone: "blue" },
    { id: "connected", label: "Contactados", value: connected, tone: "green" },
    { id: "queued", label: "En cola", value: queued, tone: "amber" },
    { id: "completed", label: "Completados", value: completed, tone: "slate" },
    { id: "won", label: "Ganados", value: won, tone: "green" },
    { id: "lost", label: "Perdidos", value: lost, tone: "red" },
    {
      id: "pipelineValue",
      label: "Pipeline",
      value: totalPipelineValue,
      format: "currency",
      tone: "blue",
    },
    { id: "speed", label: "Primer intento", value: null, format: "duration", tone: "slate" },
  ];
};

const buildFunnelMetrics = (leads: DashboardLead[], stages: PipelineStage[]) =>
  stages.map((stage) => {
    const stageLeads = leads.filter((lead) => lead.pipelineStage === stage.id);

    return {
      id: stage.id,
      label: stage.label,
      count: stageLeads.length,
      value: stageLeads.reduce((sum, lead) => sum + Number(lead.pipelineValue || 0), 0),
    };
  });

const buildCallMetrics = (leads: DashboardLead[]) => [
  {
    id: "agent_attempts",
    label: "Intentos asesoras",
    value: leads.reduce((sum, lead) => sum + Number(lead.agentAttempts || 0), 0),
  },
  {
    id: "answered",
    label: "Pacientes conectados",
    value: leads.filter((lead) => lead.customerConnectedAt).length,
  },
  {
    id: "unreachable",
    label: "No contactables",
    value: leads.filter((lead) => lead.status === "customer_unreachable").length,
  },
];

type LeadAttribution = {
  source?: string | null;
  medium?: string | null;
  channel?: string | null;
  campaign?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
};

const attributionLabels: Record<string, string> = {
  instagram_bio: "Instagram biografia",
  instagram_organic: "Instagram organico",
  google_organic: "Google organico",
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  referral: "Referido",
  direct: "Directo",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getLeadAttribution = (lead: DashboardLead): LeadAttribution => {
  const metadata = isRecord(lead.metadata) ? lead.metadata : {};
  const attribution = isRecord(metadata.attribution) ? metadata.attribution : {};
  const channel = typeof attribution.channel === "string" ? attribution.channel : null;
  const source = typeof attribution.source === "string" ? attribution.source : null;
  const medium = typeof attribution.medium === "string" ? attribution.medium : null;

  return {
    source,
    medium,
    channel: channel || source || "direct",
    campaign: typeof attribution.campaign === "string" ? attribution.campaign : null,
    landingPage: typeof attribution.landingPage === "string" ? attribution.landingPage : lead.sourceUrl || null,
    referrer: typeof attribution.referrer === "string" ? attribution.referrer : null,
  };
};

const getAttributionLabel = (attribution: LeadAttribution) => {
  const channel = attribution.channel || "direct";

  return attributionLabels[channel] || channel.replace(/[_-]+/g, " ");
};

const buildAttributionRows = (leads: DashboardLead[]) => {
  const rows = new Map<
    string,
    {
      id: string;
      label: string;
      source: string;
      medium: string;
      leads: number;
      evaluations: number;
      surgeries: number;
      won: number;
      value: number;
    }
  >();

  leads.forEach((lead) => {
    const attribution = getLeadAttribution(lead);
    const id = attribution.channel || "direct";
    const row =
      rows.get(id) ||
      {
        id,
        label: getAttributionLabel(attribution),
        source: attribution.source || id,
        medium: attribution.medium || "direct",
        leads: 0,
        evaluations: 0,
        surgeries: 0,
        won: 0,
        value: 0,
      };

    row.leads += 1;

    if (["eval_presencial", "eval_online", "presupuesto", "examenes", "cirugia"].includes(lead.pipelineStage)) {
      row.evaluations += 1;
    }

    if (lead.pipelineStage === "cirugia") {
      row.surgeries += 1;
    }

    if (lead.pipelineOutcome === "won") {
      row.won += 1;
      row.value += Number(lead.pipelineValue || 0);
    }

    rows.set(id, row);
  });

  return Array.from(rows.values()).sort((firstRow, secondRow) => {
    if (secondRow.won !== firstRow.won) {
      return secondRow.won - firstRow.won;
    }

    return secondRow.leads - firstRow.leads;
  });
};

const withLeads = (snapshot: DashboardSnapshot, leads: DashboardLead[]): DashboardSnapshot => {
  const previousSpeedMetric = snapshot.speedMetrics.find((metric) => metric.id === "speed");
  const speedMetrics = buildSpeedMetrics(leads).map((metric) =>
    metric.id === "speed" && previousSpeedMetric ? previousSpeedMetric : metric,
  );

  return {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    speedMetrics,
    funnelMetrics: buildFunnelMetrics(leads, snapshot.pipelineStages),
    callMetrics: buildCallMetrics(leads),
    leads,
  };
};

const stageVisuals: Record<
  string,
  {
    icon: typeof User;
    iconClassName: string;
    iconBackgroundClassName: string;
    borderClassName: string;
  }
> = {
  nuevo: {
    icon: User,
    iconClassName: "text-dashboard-stage-nuevo",
    iconBackgroundClassName: "bg-dashboard-stage-nuevo-soft",
    borderClassName: "border-t-dashboard-stage-nuevo",
  },
  contactado: {
    icon: Phone,
    iconClassName: "text-dashboard-stage-contactado",
    iconBackgroundClassName: "bg-dashboard-stage-contactado-soft",
    borderClassName: "border-t-dashboard-stage-contactado",
  },
  contacto_whatsapp: {
    icon: MessageCircle,
    iconClassName: "text-dashboard-stage-whatsapp",
    iconBackgroundClassName: "bg-dashboard-stage-whatsapp-soft",
    borderClassName: "border-t-dashboard-stage-whatsapp",
  },
  esperando_pago: {
    icon: CreditCard,
    iconClassName: "text-dashboard-stage-pago",
    iconBackgroundClassName: "bg-dashboard-stage-pago-soft",
    borderClassName: "border-t-dashboard-stage-pago",
  },
  eval_presencial: {
    icon: Stethoscope,
    iconClassName: "text-dashboard-stage-presencial",
    iconBackgroundClassName: "bg-dashboard-stage-presencial-soft",
    borderClassName: "border-t-dashboard-stage-presencial",
  },
  eval_online: {
    icon: Video,
    iconClassName: "text-dashboard-stage-online",
    iconBackgroundClassName: "bg-dashboard-stage-online-soft",
    borderClassName: "border-t-dashboard-stage-online",
  },
  presupuesto: {
    icon: FileText,
    iconClassName: "text-dashboard-stage-presupuesto",
    iconBackgroundClassName: "bg-dashboard-stage-presupuesto-soft",
    borderClassName: "border-t-dashboard-stage-presupuesto",
  },
  examenes: {
    icon: FlaskConical,
    iconClassName: "text-dashboard-stage-examenes",
    iconBackgroundClassName: "bg-dashboard-stage-examenes-soft",
    borderClassName: "border-t-dashboard-stage-examenes",
  },
  cirugia: {
    icon: CalendarCheck,
    iconClassName: "text-dashboard-stage-cirugia",
    iconBackgroundClassName: "bg-dashboard-stage-cirugia-soft",
    borderClassName: "border-t-dashboard-stage-cirugia",
  },
};

const formatCompactMoney = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "$0.0M";
  }

  return `$${(value / 1000000).toFixed(1)}M`;
};

const formatHoursMinutes = (seconds: number | null | undefined) => {
  const totalMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} horas`;
};

const formatElapsed = (value: string | null | undefined) => {
  if (!value) {
    return "Sin dato";
  }

  const elapsedMs = Date.now() - Date.parse(value);

  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return "Recién";
  }

  const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

const leadMatchesSearch = (lead: DashboardLead, search: string) => {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const haystack = [
    lead.fullName,
    lead.phone,
    lead.email,
    lead.procedureInterest,
    lead.assignedAgentName,
    lead.assignedAgentEmail,
    lead.pipelineOutcomeReason,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedSearch);
};

const PipelineBoard = ({
  leads,
  stages,
  onSelect,
  onStage,
  onCall,
  onOutcome,
  onNewLead,
  currentUserEmail,
  updatingLeadId,
  callingLeadId,
}: {
  leads: DashboardLead[];
  stages: PipelineStage[];
  onSelect: (lead: DashboardLead) => void;
  onStage: (leadId: string, stage: string, options?: ActionOptions) => Promise<boolean>;
  onCall: (leadId: string, options?: ActionOptions) => Promise<boolean>;
  onOutcome: (leadId: string, outcome: "active" | "lost" | "won", reason?: string, options?: ActionOptions) => Promise<boolean>;
  onNewLead: () => void;
  currentUserEmail: string | null;
  updatingLeadId: string | null;
  callingLeadId: string | null;
}) => {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "lost" | "won">("active");
  const [ownershipView, setOwnershipView] = useState<"all" | "mine">("all");
  const [winLead, setWinLead] = useState<DashboardLead | null>(null);
  const [lossLead, setLossLead] = useState<DashboardLead | null>(null);
  const [lossReasonCode, setLossReasonCode] = useState<LossReasonCode | "">("");
  const [lossReason, setLossReason] = useState("");
  const [lossError, setLossError] = useState("");

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const outcome = lead.pipelineOutcome || "active";
      const matchesView = view === "active" ? outcome !== "lost" && outcome !== "won" : outcome === view;
      const matchesOwner =
        ownershipView === "all" ||
        (currentUserEmail && lead.assignedAgentEmail?.toLowerCase() === currentUserEmail.toLowerCase());

      if (!matchesView || !matchesOwner) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return leadMatchesSearch(lead, normalizedSearch);
    });
  }, [currentUserEmail, leads, ownershipView, search, view]);

  const activeLeads = leads.filter(
    (lead) => lead.pipelineOutcome !== "lost" && lead.pipelineOutcome !== "won",
  );
  const lostCount = leads.filter((lead) => lead.pipelineOutcome === "lost").length;
  const wonLeads = leads.filter((lead) => lead.pipelineOutcome === "won");
  const activeValue = activeLeads.reduce((sum, lead) => sum + Number(lead.pipelineValue || 0), 0);
  const wonValue = wonLeads.reduce((sum, lead) => sum + Number(lead.pipelineValue || 0), 0);

  const handleDrop = async (stageId: string) => {
    const droppedLeadId = dragId;
    setDragId(null);
    setOverStage(null);

    if (!droppedLeadId) {
      return;
    }

    await onStage(droppedLeadId, stageId);
  };

  const openWinConfirm = (lead: DashboardLead) => {
    setWinLead(lead);
  };

  const openLossConfirm = (lead: DashboardLead) => {
    setLossLead(lead);
    setLossReasonCode("");
    setLossReason("");
    setLossError("");
  };

  const confirmWin = async () => {
    if (!winLead) {
      return;
    }

    const saved = await onOutcome(winLead.id, "won");

    if (saved) {
      setWinLead(null);
    }
  };

  const confirmLoss = async () => {
    if (!lossLead) {
      return;
    }

    if (!lossReasonCode) {
      setLossError("Selecciona el motivo de perdida.");
      return;
    }

    const saved = await onOutcome(lossLead.id, "lost", lossReason.trim(), { reasonCode: lossReasonCode });

    if (saved) {
      setLossLead(null);
      setLossReasonCode("");
      setLossReason("");
      setLossError("");
    } else {
      setLossError("No pudimos marcar la oportunidad como perdida.");
    }
  };

  const viewButtons = [
    { id: "active", label: "Pipeline activo", value: formatCompactMoney(activeValue) },
    { id: "won", label: "Ganadas", value: formatCompactMoney(wonValue) },
    { id: "lost", label: "Perdidas", value: String(lostCount) },
  ] as const;

  const renderLeadCard = (lead: DashboardLead, stage?: PipelineStage) => {
    const visual = stageVisuals[stage?.id || lead.pipelineStage] || stageVisuals.nuevo;
    const isUpdating = updatingLeadId === lead.id;
    const isCalling = callingLeadId === lead.id;
    const actionsDisabled = isUpdating || Boolean(callingLeadId);
    const actionMenu = (
      <>
        <DropdownMenuItem
          onSelect={() => void onCall(lead.id)}
          disabled={actionsDisabled}
          className="gap-2"
        >
          <Phone className={`h-4 w-4 ${isCalling ? "animate-pulse" : ""}`} />
          {isCalling ? "Llamando" : "Llamar"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => openWinConfirm(lead)}
          disabled={isUpdating}
          className="gap-2 text-emerald-700 focus:text-emerald-800"
        >
          <Target className="h-4 w-4" />
          Ganar
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => openLossConfirm(lead)}
          disabled={isUpdating}
          className="gap-2 text-red-700 focus:text-red-800"
        >
          <XCircle className="h-4 w-4" />
          Perder
        </DropdownMenuItem>
      </>
    );
    const contextActionMenu = (
      <>
        <ContextMenuItem
          onSelect={() => void onCall(lead.id)}
          disabled={actionsDisabled}
          className="gap-2"
        >
          <Phone className={`h-4 w-4 ${isCalling ? "animate-pulse" : ""}`} />
          {isCalling ? "Llamando" : "Llamar"}
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => openWinConfirm(lead)}
          disabled={isUpdating}
          className="gap-2 text-emerald-700 focus:text-emerald-800"
        >
          <Target className="h-4 w-4" />
          Ganar
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => openLossConfirm(lead)}
          disabled={isUpdating}
          className="gap-2 text-red-700 focus:text-red-800"
        >
          <XCircle className="h-4 w-4" />
          Perder
        </ContextMenuItem>
      </>
    );

    return (
      <ContextMenu key={lead.id}>
        <ContextMenuTrigger asChild>
          <article
            draggable={view === "active" && !isUpdating}
            onDragStart={(event) => {
              setDragId(lead.id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", lead.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverStage(null);
            }}
            className={`group rounded-lg border border-dashboard-line border-t-[3px] bg-white p-3 shadow-sm transition ${visual.borderClassName} ${
              isUpdating ? "cursor-wait opacity-60" : "cursor-grab active:cursor-grabbing"
            } ${dragId === lead.id ? "opacity-40" : "hover:-translate-y-0.5 hover:shadow-md"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <button className="min-w-0 flex-1 text-left" type="button" onClick={() => onSelect(lead)}>
                <h3 className="truncate text-[14px] font-bold text-dashboard-ink">{lead.fullName}</h3>
                <p className="mt-1 truncate text-xs font-medium text-dashboard-muted">
                  {lead.procedureInterest || "Evaluacion"}
                </p>
              </button>
              <div className="flex shrink-0 items-start gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-md p-1 text-dashboard-muted opacity-0 outline-none transition hover:bg-dashboard-soft hover:text-dashboard-primary focus:opacity-100 focus-visible:ring-2 focus-visible:ring-dashboard-primary group-hover:opacity-100"
                      aria-label={`Acciones para ${lead.fullName}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {actionMenu}
                  </DropdownMenuContent>
                </DropdownMenu>
                <GripVertical className="mt-0.5 h-4 w-4 text-dashboard-icon transition group-hover:text-dashboard-muted" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <strong className="text-lg font-bold tracking-[-0.01em] text-dashboard-ink">
                {formatCompactMoney(lead.pipelineValue)}
              </strong>
              <LeadStatusBadge lead={lead} />
            </div>

            <div className="mt-3 grid gap-1.5 text-[11px] text-dashboard-subtle">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{lead.assignedAgentName || "Sin asesora"}</span>
                <span className="shrink-0">{formatDate(lead.createdAt)}</span>
              </div>
              <span className="truncate">{lead.phone}</span>
            </div>

            <label
              className="mt-3 block text-[11px] font-bold uppercase tracking-wide text-dashboard-subtle md:hidden"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
            >
              Etapa
              <select
                className="mt-1 h-9 w-full rounded-md border border-dashboard-line-strong bg-white px-2 text-xs font-semibold normal-case tracking-normal text-dashboard-ink outline-none focus:border-dashboard-primary"
                value={lead.pipelineStage}
                disabled={isUpdating}
                onChange={(event) => {
                  void onStage(lead.id, event.target.value);
                }}
              >
                {stages.map((stageOption) => (
                  <option key={stageOption.id} value={stageOption.id}>
                    {stageOption.label}
                  </option>
                ))}
              </select>
            </label>
          </article>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          {contextActionMenu}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-dashboard-line-soft bg-dashboard-page px-4 py-3 lg:px-6">
        <div className="flex min-w-[260px] flex-1 flex-wrap items-center gap-2">
          {viewButtons.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                view === item.id
                  ? "border-dashboard-primary bg-dashboard-soft text-dashboard-primary"
                  : "border-dashboard-line bg-white text-dashboard-muted hover:border-dashboard-line-hover"
              }`}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wide">{item.label}</span>
              <span className="mt-0.5 block text-sm font-bold">{item.value}</span>
            </button>
          ))}
        </div>
        <label className="relative w-full sm:w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-subtle" />
          <input
            className="h-10 w-full rounded-lg border border-dashboard-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-dashboard-primary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar paciente, telefono o asesora"
          />
        </label>
        <div className="flex rounded-lg border border-dashboard-line bg-white p-1">
          {[
            { id: "all", label: "Todos" },
            { id: "mine", label: "Míos" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                ownershipView === item.id ? "bg-dashboard-soft text-dashboard-primary" : "text-dashboard-muted"
              }`}
              onClick={() => setOwnershipView(item.id as "all" | "mine")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onNewLead}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-dashboard-primary px-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo lead
        </button>
        <button
          type="button"
          onClick={() => exportLeadsCsv(filteredLeads, `cirugia360-pipeline-${view}`)}
          disabled={filteredLeads.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-dashboard-line bg-white px-3 text-sm font-bold text-dashboard-muted transition hover:text-dashboard-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {view === "active" ? (
        <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden px-4 py-4 lg:px-6">
          {stages.map((stage) => {
            const stageLeads = filteredLeads.filter((lead) => lead.pipelineStage === stage.id);
            const total = activeLeads
              .filter((lead) => lead.pipelineStage === stage.id)
              .reduce((sum, lead) => sum + Number(lead.pipelineValue || 0), 0);
            const visual = stageVisuals[stage.id] || stageVisuals.nuevo;
            const Icon = visual.icon;
            const isOver = overStage === stage.id;

            return (
              <section
                key={stage.id}
                data-pipeline-stage={stage.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setOverStage(stage.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setOverStage(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleDrop(stage.id);
                }}
                className={`flex h-full w-[min(86vw,300px)] shrink-0 flex-col rounded-lg border p-3 transition md:w-[300px] ${
                  isOver ? "border-dashboard-primary bg-dashboard-soft" : "border-dashboard-line bg-dashboard-surface"
                }`}
              >
                <header className="mb-3 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${visual.iconBackgroundClassName} ${visual.iconClassName}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-dashboard-ink">{stage.label}</h2>
                        <p className="text-xs font-semibold text-dashboard-subtle">{formatCompactMoney(total)}</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-dashboard-muted">
                      {stageLeads.length}
                    </span>
                  </div>
                </header>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {stageLeads.map((lead) => renderLeadCard(lead, stage))}
                  {stageLeads.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-dashboard-line-strong bg-white/70 p-4 text-sm font-medium text-dashboard-subtle">
                      Suelta una oportunidad aqui.
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 py-4 lg:px-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(lead)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(lead);
                  }
                }}
                className="rounded-lg border border-dashboard-line bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-dashboard-ink">{lead.fullName}</h3>
                    <p className="mt-1 truncate text-xs text-dashboard-muted">
                      {lead.procedureInterest || "Evaluacion"}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      view === "won"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {view === "won" ? "Ganada" : "Perdida"}
                  </span>
                </div>
                <strong className="mt-3 block text-xl font-bold text-dashboard-ink">
                  {formatCurrency(lead.pipelineValue)}
                </strong>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-dashboard-subtle">
                  <span>{lead.assignedAgentName || "Sin asesora"}</span>
                  <span>{formatDate(lead.createdAt)}</span>
                </div>
                {view === "lost" && (lead.pipelineOutcomeReasonCode || lead.pipelineOutcomeReason) ? (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-dashboard-muted">
                    {[getLossReasonLabel(lead.pipelineOutcomeReasonCode), lead.pipelineOutcomeReason].filter(Boolean).join(" - ")}
                  </p>
                ) : null}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onOutcome(lead.id, "active");
                    }}
                    className="rounded-md border border-dashboard-line px-3 py-1.5 text-xs font-bold text-dashboard-primary"
                  >
                    Reabrir
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredLeads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-dashboard-line-strong bg-white p-6 text-sm font-medium text-dashboard-subtle">
              No hay oportunidades para esta vista.
            </div>
          ) : null}
        </div>
      )}

      {winLead ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={() => setWinLead(null)}>
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-dashboard-line px-5 py-4">
              <h2 className="text-base font-bold text-dashboard-ink">Marcar como ganada</h2>
              <button type="button" className="rounded-md p-1.5 hover:bg-slate-100" onClick={() => setWinLead(null)}>
                <XCircle className="h-5 w-5 text-dashboard-muted" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-sm leading-6 text-dashboard-muted">
                {winLead.fullName} saldra del pipeline activo y quedara registrada en Ganadas.
              </p>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                Valor comercial: {formatCurrency(winLead.pipelineValue)}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-dashboard-line px-5 py-4">
              <button
                type="button"
                className="rounded-md border border-dashboard-line px-3 py-2 text-sm font-bold text-dashboard-muted"
                onClick={() => setWinLead(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
                onClick={() => void confirmWin()}
              >
                Marcar ganada
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {lossLead ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={() => setLossLead(null)}>
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-dashboard-line px-5 py-4">
              <h2 className="text-base font-bold text-dashboard-ink">Marcar como perdida</h2>
              <button type="button" className="rounded-md p-1.5 hover:bg-slate-100" onClick={() => setLossLead(null)}>
                <XCircle className="h-5 w-5 text-dashboard-muted" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-sm leading-6 text-dashboard-muted">
                {lossLead.fullName} saldra del pipeline activo y quedara registrada en Perdidas.
              </p>
              <label className="block text-sm font-medium">
                Motivo
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-dashboard-line bg-white px-3 text-sm outline-none focus:border-dashboard-primary"
                  value={lossReasonCode}
                  onChange={(event) => {
                    setLossReasonCode(event.target.value as LossReasonCode);
                    setLossError("");
                  }}
                >
                  <option value="">Seleccionar motivo</option>
                  {lossReasonOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                className="min-h-28 w-full rounded-lg border border-dashboard-line px-3 py-2 text-sm outline-none focus:border-dashboard-primary"
                value={lossReason}
                onChange={(event) => {
                  setLossReason(event.target.value);
                  setLossError("");
                }}
                placeholder="Detalle opcional"
              />
              {lossError ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{lossError}</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-dashboard-line px-5 py-4">
              <button
                type="button"
                className="rounded-md border border-dashboard-line px-3 py-2 text-sm font-bold text-dashboard-muted"
                onClick={() => setLossLead(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white"
                onClick={() => void confirmLoss()}
              >
                Marcar perdida
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

const LEADS_PAGE_SIZE = 50;

const getSortValue = (lead: DashboardLead, sortKey: LeadSortKey) => {
  if (sortKey === "status") {
    return getLeadStatus(lead).label;
  }

  if (sortKey === "createdAt") {
    return Date.parse(lead.createdAt) || 0;
  }

  return String(lead[sortKey] || "").toLowerCase();
};

const LeadsTable = ({
  leads,
  onSelect,
  onCall,
  onNewLead,
  currentUserEmail,
  callingLeadId,
}: {
  leads: DashboardLead[];
  onSelect: (lead: DashboardLead) => void;
  onCall: (leadId: string, options?: ActionOptions) => Promise<boolean>;
  onNewLead: () => void;
  currentUserEmail: string | null;
  callingLeadId: string | null;
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [ownershipView, setOwnershipView] = useState<"all" | "mine">("all");
  const [sortKey, setSortKey] = useState<LeadSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const statusOptions = useMemo(() => {
    const labels = new Map<string, string>();

    for (const lead of leads) {
      const status = getLeadStatus(lead).label;
      labels.set(status, status);
    }

    return Array.from(labels.values()).sort((a, b) => a.localeCompare(b, "es"));
  }, [leads]);

  const agentOptions = useMemo(() => {
    const agents = new Set(leads.map((lead) => lead.assignedAgentName || "Sin asignar"));
    return Array.from(agents.values()).sort((a, b) => a.localeCompare(b, "es"));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const sortedLeads = leads
      .filter((lead) => leadMatchesSearch(lead, search))
      .filter(
        (lead) =>
          ownershipView === "all" ||
          (currentUserEmail && lead.assignedAgentEmail?.toLowerCase() === currentUserEmail.toLowerCase()),
      )
      .filter((lead) => statusFilter === "all" || getLeadStatus(lead).label === statusFilter)
      .filter((lead) => agentFilter === "all" || (lead.assignedAgentName || "Sin asignar") === agentFilter)
      .sort((firstLead, secondLead) => {
        const firstValue = getSortValue(firstLead, sortKey);
        const secondValue = getSortValue(secondLead, sortKey);
        const direction = sortDirection === "asc" ? 1 : -1;

        if (typeof firstValue === "number" && typeof secondValue === "number") {
          return (firstValue - secondValue) * direction;
        }

        return String(firstValue).localeCompare(String(secondValue), "es") * direction;
      });

    return sortedLeads;
  }, [agentFilter, currentUserEmail, leads, ownershipView, search, sortDirection, sortKey, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const shouldPaginate = filteredLeads.length > LEADS_PAGE_SIZE;
  const visibleLeads = shouldPaginate
    ? filteredLeads.slice((currentPage - 1) * LEADS_PAGE_SIZE, currentPage * LEADS_PAGE_SIZE)
    : filteredLeads;

  useEffect(() => {
    setPage(1);
  }, [agentFilter, ownershipView, search, statusFilter]);

  const changeSort = (nextSortKey: LeadSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "createdAt" ? "desc" : "asc");
  };

  const sortLabel = (key: LeadSortKey) =>
    sortKey === key ? (sortDirection === "asc" ? "ascendente" : "descendente") : "sin ordenar";

  const SortButton = ({ label, value }: { label: string; value: LeadSortKey }) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-semibold text-slate-500 transition hover:text-slate-900"
      onClick={() => changeSort(value)}
      aria-label={`Ordenar por ${label}, ${sortLabel(value)}`}
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
        <label className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-subtle" />
          <input
            className="h-10 w-full rounded-lg border border-dashboard-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-dashboard-primary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar paciente, telefono, procedimiento o asesora"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:w-[420px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado
            <select
              className="mt-1 h-10 w-full rounded-lg border border-dashboard-line bg-white px-3 text-sm font-normal normal-case text-slate-900 outline-none focus:border-dashboard-primary"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Asesora
            <select
              className="mt-1 h-10 w-full rounded-lg border border-dashboard-line bg-white px-3 text-sm font-normal normal-case text-slate-900 outline-none focus:border-dashboard-primary"
              value={agentFilter}
              onChange={(event) => setAgentFilter(event.target.value)}
            >
              <option value="all">Todas</option>
              {agentOptions.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex h-10 rounded-lg border border-dashboard-line bg-white p-1">
          {[
            { id: "all", label: "Todos" },
            { id: "mine", label: "Míos" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-md px-3 text-xs font-bold ${
                ownershipView === item.id ? "bg-dashboard-soft text-dashboard-primary" : "text-dashboard-muted"
              }`}
              onClick={() => setOwnershipView(item.id as "all" | "mine")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onNewLead}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-dashboard-primary px-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo lead
        </button>
        <button
          type="button"
          onClick={() => exportLeadsCsv(filteredLeads, "cirugia360-leads")}
          disabled={filteredLeads.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-dashboard-line bg-white px-3 text-sm font-bold text-dashboard-muted transition hover:text-dashboard-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          Exportar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-left text-sm">
          <caption className="sr-only">Listado de leads comerciales</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide">
            <tr>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Paciente" value="fullName" />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Procedimiento" value="procedureInterest" />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Asesora" value="assignedAgentName" />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Estado" value="status" />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Creado" value="createdAt" />
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleLeads.map((lead) => {
              const isCalling = callingLeadId === lead.id;

              return (
                <tr key={lead.id} className="align-middle transition hover:bg-slate-50">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <button type="button" className="min-w-0 text-left" onClick={() => onSelect(lead)}>
                      <strong className="block max-w-[240px] truncate font-semibold text-slate-950">{lead.fullName}</strong>
                      <span className="block text-xs text-slate-500">{lead.phone}</span>
                    </button>
                  </th>
                  <td className="max-w-[220px] truncate px-4 py-3">{lead.procedureInterest || "Evaluacion"}</td>
                  <td className="max-w-[180px] truncate px-4 py-3">{lead.assignedAgentName || "Sin asignar"}</td>
                  <td className="px-4 py-3">
                    <LeadStatusBadge lead={lead} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void onCall(lead.id)}
                      disabled={Boolean(callingLeadId)}
                      className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Phone className={`h-3.5 w-3.5 ${isCalling ? "animate-pulse" : ""}`} />
                      {isCalling ? "Llamando" : "Llamar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visibleLeads.length === 0 ? (
        <div className="border-t border-slate-100 p-6 text-sm font-medium text-slate-500">
          No hay leads que coincidan con los filtros.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Mostrando {visibleLeads.length} de {filteredLeads.length} leads
        </span>
        {shouldPaginate ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((currentPageValue) => Math.max(1, currentPageValue - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((currentPageValue) => Math.min(totalPages, currentPageValue + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

const formatCallDuration = (value: number | null | undefined) => {
  const totalSeconds = Math.max(0, Math.round(Number(value || 0)));

  if (!totalSeconds) {
    return null;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const getTranscriptionStatusLabel = (status: string | null | undefined) => {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "stopped":
      return "Transcripcion lista";
    case "failed":
    case "error":
      return "Transcripcion con error";
    case "in-progress":
    case "started":
    case "transcription-started":
      return "Transcribiendo";
    default:
      return status ? status.replace(/[_-]/g, " ") : "";
  }
};

const RecordingTranscriptionSection = ({ lead }: { lead: DashboardLead }) => {
  const transcriptionSegments = (lead.transcriptionSegments || []).filter((segment) => segment.text.trim());
  const hasFallbackText = Boolean(lead.transcriptionText?.trim());
  const durationLabel = formatCallDuration(lead.recordingDuration);
  const transcriptionStatusLabel = getTranscriptionStatusLabel(lead.transcriptionStatus);
  const shouldShow =
    Boolean(lead.recordingUrl) ||
    Boolean(lead.recordingStatus) ||
    Boolean(transcriptionStatusLabel) ||
    transcriptionSegments.length > 0 ||
    hasFallbackText;

  if (!shouldShow) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">Grabacion y transcripcion</h3>
        {transcriptionStatusLabel ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {transcriptionStatusLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {lead.recordingUrl ? (
          <a className="inline-flex items-center gap-1.5 font-medium text-teal-700" href={lead.recordingUrl} target="_blank" rel="noreferrer">
            <Phone className="h-3.5 w-3.5" />
            Abrir grabacion
          </a>
        ) : null}
        {durationLabel ? <span className="text-xs text-slate-500">{durationLabel}</span> : null}
        {lead.recordingStatus && !lead.recordingUrl ? (
          <span className="text-xs font-medium text-slate-500">Grabacion {lead.recordingStatus}</span>
        ) : null}
      </div>

      {transcriptionSegments.length > 0 ? (
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto border-t border-slate-100 pt-3">
          {transcriptionSegments.map((segment) => {
            const isAgent = segment.speaker === "agent";

            return (
              <div
                key={segment.id}
                className={`border-l-2 pl-3 ${isAgent ? "border-teal-500" : "border-sky-500"}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <span>{segment.label || (isAgent ? "Agente" : "Cliente")}</span>
                  {segment.timestamp ? <span>{formatDate(segment.timestamp)}</span> : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{segment.text}</p>
              </div>
            );
          })}
        </div>
      ) : hasFallbackText ? (
        <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm leading-6 text-slate-700">
          {lead.transcriptionText}
        </p>
      ) : (
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
          La transcripcion aparecera cuando Twilio envie el texto.
        </p>
      )}
    </section>
  );
};

const LeadDetail = ({
  lead,
  stages,
  settings,
  onClose,
  onStage,
  onValue,
  onOutcome,
  onNote,
  onUpdateNote,
  onDeleteNote,
  onAgent,
  onCallback,
  onCall,
}: {
  lead: DashboardLead;
  stages: PipelineStage[];
  settings: AgentSettings | null;
  onClose: () => void;
  onStage: (leadId: string, stage: string, options?: ActionOptions) => Promise<boolean>;
  onValue: (leadId: string, pipelineValue: number, options?: ActionOptions) => Promise<boolean>;
  onOutcome: (leadId: string, outcome: "active" | "lost" | "won", reason?: string, options?: ActionOptions) => Promise<boolean>;
  onNote: (leadId: string, body: string, options?: ActionOptions) => Promise<boolean>;
  onUpdateNote: (leadId: string, noteId: number, body: string, options?: ActionOptions) => Promise<boolean>;
  onDeleteNote: (leadId: string, noteId: number, options?: ActionOptions) => Promise<boolean>;
  onAgent: (leadId: string, assignedAgentId: string, options?: ActionOptions) => Promise<boolean>;
  onCallback: (leadId: string, callbackTime: string | null, callbackContext: string, options?: ActionOptions) => Promise<boolean>;
  onCall: (leadId: string, options?: ActionOptions) => Promise<boolean>;
}) => {
  const [note, setNote] = useState("");
  const [value, setValue] = useState(String(Math.round(lead.pipelineValue || 0)));
  const [reasonCode, setReasonCode] = useState<LossReasonCode | "">((lead.pipelineOutcomeReasonCode as LossReasonCode) || "");
  const [reason, setReason] = useState(lead.pipelineOutcomeReason || "");
  const [callbackTime, setCallbackTime] = useState(toDateTimeLocalValue(lead.dispatchScheduledAt));
  const [callbackContext, setCallbackContext] = useState(lead.callbackContext || "");
  const [savingAction, setSavingAction] = useState<
    | "value"
    | "note"
    | "edit-note"
    | "callback"
    | "clear-callback"
    | "outcome-active"
    | "outcome-won"
    | "outcome-lost"
    | null
  >(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const isSaving = savingAction !== null || deletingNoteId !== null;
  const [error, setError] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [drawerToast, setDrawerToast] = useState<{ id: number; tone: ToastTone; title: string; detail?: string } | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const assignableAgents = settings?.agents || [];
  const selectedAgentId =
    assignableAgents.find(
      (agent) => agent.email === lead.assignedAgentEmail || agent.name === lead.assignedAgentName,
    )?.id || "";
  const sortedNotes = useMemo(
    () =>
      [...lead.notes].sort(
        (firstNote, secondNote) => Date.parse(secondNote.createdAt) - Date.parse(firstNote.createdAt),
      ),
    [lead.notes],
  );

  const showDrawerToast = (tone: ToastTone, title: string, detail?: string) => {
    const id = Date.now();
    setDrawerToast({ id, tone, title, detail });
    window.setTimeout(() => {
      setDrawerToast((currentToast) => (currentToast?.id === id ? null : currentToast));
    }, 4000);
  };

  const drawerToastClassName =
    drawerToast?.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : drawerToast?.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-900";

  useEffect(() => {
    const firstInteractiveElement = drawerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    firstInteractiveElement?.focus();

    const getFocusableElements = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter((element) => element.offsetParent !== null);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const saveValue = async () => {
    setSavingAction("value");
    setError("");

    try {
      const saved = await onValue(lead.id, Number(value || 0), { skipToast: true });

      if (!saved) {
        setError("No pudimos guardar.");
        showDrawerToast("error", "No pudimos guardar el valor.");
      } else {
        showDrawerToast("success", "Valor comercial guardado.");
      }
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "No pudimos guardar.";
      setError(message);
      showDrawerToast("error", message);
    } finally {
      setSavingAction(null);
    }
  };

  const saveOutcome = async (outcome: "active" | "lost" | "won") => {
    if (outcome === "lost" && !reasonCode) {
      setError("Selecciona el motivo de perdida.");
      showDrawerToast("warning", "Selecciona el motivo de perdida.");
      return;
    }

    setSavingAction(`outcome-${outcome}` as "outcome-active" | "outcome-won" | "outcome-lost");
    setError("");

    try {
      const saved = await onOutcome(lead.id, outcome, reason.trim(), {
        skipToast: outcome === "active",
        skipUndoToast: outcome === "active",
        reasonCode: outcome === "lost" ? reasonCode : null,
      });

      if (!saved) {
        setError("No pudimos guardar.");
        showDrawerToast("error", "No pudimos guardar.");
      } else {
        const outcomeText = outcome === "won" ? "ganada" : outcome === "lost" ? "perdida" : "activa";
        showDrawerToast("success", `Oportunidad ${outcomeText}.`);
      }
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "No pudimos guardar.";
      setError(message);
      showDrawerToast("error", message);
    } finally {
      setSavingAction(null);
    }
  };

  const saveNote = async () => {
    if (!note.trim()) {
      return;
    }

    setSavingAction("note");
    setError("");

    try {
      const saved = await onNote(lead.id, note, { skipToast: true });

      if (saved) {
        setNote("");
        showDrawerToast("success", "Nota guardada.");
      } else {
        setError("No pudimos guardar la nota.");
        showDrawerToast("error", "No pudimos guardar la nota.");
      }
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "No pudimos guardar la nota.";
      setError(message);
      showDrawerToast("error", message);
    } finally {
      setSavingAction(null);
    }
  };

  const updateDrawerStage = async (stage: string) => {
    const saved = await onStage(lead.id, stage, { skipToast: true });

    if (saved) {
      showDrawerToast("success", "Etapa actualizada.");
    } else {
      showDrawerToast("error", "No pudimos actualizar la etapa.");
    }
  };

  const callFromDrawer = async () => {
    const called = await onCall(lead.id, { skipToast: true });

    if (called) {
      showDrawerToast("success", "Llamada solicitada.");
    } else {
      showDrawerToast("error", "No pudimos iniciar la llamada.");
    }
  };

  const updateDrawerAgent = async (assignedAgentId: string) => {
    const saved = await onAgent(lead.id, assignedAgentId, { skipToast: true });

    if (saved) {
      showDrawerToast("success", "Asesora actualizada.");
    } else {
      showDrawerToast("error", "No pudimos actualizar la asesora.");
    }
  };

  const saveCallback = async () => {
    const callbackTimeIso = dateTimeLocalToIso(callbackTime);

    if (!callbackTimeIso) {
      setError("Selecciona fecha y hora para volver a llamar.");
      showDrawerToast("warning", "Selecciona fecha y hora para volver a llamar.");
      return;
    }

    if (Date.parse(callbackTimeIso) <= Date.now() - 60000) {
      setError("La hora de rellamada debe ser futura.");
      showDrawerToast("warning", "La hora de rellamada debe ser futura.");
      return;
    }

    setSavingAction("callback");
    setError("");

    const saved = await onCallback(lead.id, callbackTimeIso, callbackContext, { skipToast: true });
    setSavingAction(null);

    if (saved) {
      showDrawerToast("success", "Rellamada programada.", formatDate(callbackTimeIso));
    } else {
      showDrawerToast("error", "No pudimos programar la rellamada.");
    }
  };

  const clearCallback = async () => {
    setSavingAction("clear-callback");
    setError("");

    const saved = await onCallback(lead.id, null, "", { skipToast: true });
    setSavingAction(null);

    if (saved) {
      setCallbackTime("");
      setCallbackContext("");
      showDrawerToast("success", "Rellamada cancelada.");
    } else {
      showDrawerToast("error", "No pudimos cancelar la rellamada.");
    }
  };

  const startEditingNote = (leadNote: LeadNote) => {
    setEditingNoteId(leadNote.id);
    setEditingNoteBody(leadNote.body);
  };

  const saveEditedNote = async () => {
    if (!editingNoteId || !editingNoteBody.trim()) {
      return;
    }

    setSavingAction("edit-note");
    const saved = await onUpdateNote(lead.id, editingNoteId, editingNoteBody, { skipToast: true });
    setSavingAction(null);

    if (saved) {
      setEditingNoteId(null);
      setEditingNoteBody("");
      showDrawerToast("success", "Nota actualizada.");
    } else {
      showDrawerToast("error", "No pudimos actualizar la nota.");
    }
  };

  const deleteNote = async (leadNote: LeadNote) => {
    const confirmed = window.confirm("¿Eliminar esta nota? Quedará registrada en auditoría.");

    if (!confirmed) {
      return;
    }

    setDeletingNoteId(leadNote.id);
    const deleted = await onDeleteNote(lead.id, leadNote.id);
    setDeletingNoteId(null);

    if (deleted) {
      showDrawerToast("success", "Nota eliminada.");
    } else {
      showDrawerToast("error", "No pudimos eliminar la nota.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/20"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        ref={drawerRef}
        className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detail-title"
      >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <h2 id="lead-detail-title" className="text-lg font-semibold">{lead.fullName}</h2>
          <p className="text-sm text-slate-500">{lead.phone}</p>
        </div>
        <button type="button" className="rounded-md p-2 hover:bg-slate-100" onClick={onClose}>
          <XCircle className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 p-5">
        {drawerToast ? (
          <div className={`sticky top-[73px] z-20 rounded-lg border px-4 py-3 text-sm shadow-sm ${drawerToastClassName}`}>
            <p className="font-semibold">{drawerToast.title}</p>
            {drawerToast.detail ? <p className="mt-1 text-xs opacity-80">{drawerToast.detail}</p> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void callFromDrawer()}
            className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
          >
            <Phone className="h-4 w-4" />
            Llamar con flujo normal
          </button>
          <LeadStatusBadge lead={lead} />
        </div>

        <section className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
          <Detail label="Procedimiento" value={lead.procedureInterest || "Evaluacion"} />
          <Detail label="Email" value={lead.email || "Sin dato"} />
          <Detail label="Creado" value={formatDate(lead.createdAt)} />
          <label className="text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Asesora</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              value={selectedAgentId}
              onChange={(event) => void updateDrawerAgent(event.target.value)}
            >
              <option value="">Sin asignar</option>
              {assignableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.active === false ? `${agent.name} (inactiva)` : agent.name}
                </option>
              ))}
            </select>
            {assignableAgents.length === 0 ? (
              <span className="mt-1 block text-xs text-amber-700">
                Agrega vendedoras en Equipo para poder asignar leads.
              </span>
            ) : null}
          </label>
          <Detail label="Intentos" value={lead.agentAttempts ? String(lead.agentAttempts) : "Sin intentos"} />
          <Detail label="Ultimo error" value={lead.lastError || "Sin error"} tone={lead.lastError ? "danger" : "default"} />
        </section>

        <section className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Volver a llamar</h3>
              {lead.dispatchScheduledAt ? (
                <p className="mt-1 text-xs text-slate-500">Programada para {formatDate(lead.dispatchScheduledAt)}</p>
              ) : null}
            </div>
            {lead.dispatchScheduledAt ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void clearCallback()}
                disabled={isSaving}
              >
                {savingAction === "clear-callback" ? (
                  <RefreshCcw className="h-3 w-3 animate-spin" />
                ) : null}
                {savingAction === "clear-callback" ? "Cancelando..." : "Cancelar"}
              </button>
            ) : null}
          </div>
          <div className="grid gap-3">
            <label className="text-sm">
              Fecha y hora
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={callbackTime}
                onChange={(event) => setCallbackTime(event.target.value)}
              />
            </label>
            <label className="text-sm">
              Contexto
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={callbackContext}
                onChange={(event) => setCallbackContext(event.target.value)}
                placeholder="Ej: Prefiere llamada despues de las 17:00, preguntar por disponibilidad de pabellon."
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void saveCallback()}
                disabled={isSaving}
              >
                {savingAction === "callback" ? (
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                ) : null}
                {savingAction === "callback" ? "Programando..." : "Programar rellamada"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold">Pipeline</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Etapa
              <select
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={lead.pipelineStage}
                onChange={(event) => void updateDrawerStage(event.target.value)}
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Valor comercial
              <div className="mt-1 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2"
                  inputMode="numeric"
                  value={value}
                  onChange={(event) => setValue(event.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={saveValue}
                  disabled={isSaving}
                  aria-label={savingAction === "value" ? "Guardando valor" : "Guardar valor comercial"}
                >
                  {savingAction === "value" ? (
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => saveOutcome("active")}
              disabled={isSaving}
            >
              {savingAction === "outcome-active" ? (
                <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {savingAction === "outcome-active" ? "Guardando..." : "Activo"}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => saveOutcome("won")}
              disabled={isSaving}
            >
              {savingAction === "outcome-won" ? (
                <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {savingAction === "outcome-won" ? "Guardando..." : "Ganado"}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => saveOutcome("lost")}
              disabled={isSaving}
            >
              {savingAction === "outcome-lost" ? (
                <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {savingAction === "outcome-lost" ? "Guardando..." : "Perdido"}
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            <label className="text-sm">
              Motivo de perdida
              <select
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value as LossReasonCode)}
              >
                <option value="">Seleccionar motivo</option>
                {lossReasonOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Detalle opcional"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        </section>

        <RecordingTranscriptionSection lead={lead} />

        <section className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold">Notas</h3>
          <textarea
            className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={saveNote}
            disabled={isSaving || !note.trim()}
          >
            {savingAction === "note" ? <RefreshCcw className="h-4 w-4 animate-spin" /> : null}
            {savingAction === "note" ? "Guardando..." : "Guardar nota"}
          </button>
          <div className="mt-4 space-y-3">
            {sortedNotes.map((leadNote) => (
              <div key={leadNote.id} className="rounded-md bg-slate-50 p-3 text-sm">
                {editingNoteId === leadNote.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      value={editingNoteBody}
                      onChange={(event) => setEditingNoteBody(event.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteBody("");
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => void saveEditedNote()}
                        disabled={isSaving || !editingNoteBody.trim()}
                      >
                        {savingAction === "edit-note" ? (
                          <RefreshCcw className="h-3 w-3 animate-spin" />
                        ) : null}
                        {savingAction === "edit-note" ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-slate-800">{leadNote.body}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(leadNote.createdAt)} - {leadNote.authorEmail || "Dashboard"}
                  {leadNote.updatedAt ? ` · Editada ${formatDate(leadNote.updatedAt)}` : ""}
                </p>
                {editingNoteId !== leadNote.id ? (
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-dashboard-primary"
                      onClick={() => startEditingNote(leadNote)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => void deleteNote(leadNote)}
                      disabled={isSaving}
                    >
                      {deletingNoteId === leadNote.id ? (
                        <RefreshCcw className="h-3 w-3 animate-spin" />
                      ) : null}
                      {deletingNoteId === leadNote.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      </div>
      </aside>
    </div>
  );
};

const Detail = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value?: string | number | null;
  tone?: "default" | "warning" | "danger";
}) => {
  const displayValue = value === null || value === undefined || String(value).trim() === "" ? "Sin dato" : String(value);
  const valueClassName =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-slate-900";

  return (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-1 break-words text-sm font-medium ${valueClassName}`}>{displayValue}</p>
  </div>
  );
};

const CreateLeadModal = ({
  settings,
  onClose,
  onCreate,
}: {
  settings: AgentSettings | null;
  onClose: () => void;
  onCreate: (payload: CreateLeadPayload) => Promise<boolean>;
}) => {
  const [draft, setDraft] = useState<CreateLeadPayload>({
    fullName: "",
    phone: "",
    procedureInterest: "Evaluacion",
    assignedAgentId: "",
    pipelineValue: 0,
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const activeAgents = (settings?.agents || []).filter((agent) => agent.active !== false);

  useEffect(() => {
    firstInputRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!draft.fullName.trim() || !draft.phone.trim()) {
      setError("Ingresa nombre y telefono.");
      return;
    }

    setIsSaving(true);

    try {
      const created = await onCreate({
        ...draft,
        pipelineValue: Number(draft.pipelineValue || 0),
      });

      if (created) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        className="w-full max-w-lg rounded-lg bg-white shadow-xl"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-lead-title"
      >
        <div className="flex items-center justify-between border-b border-dashboard-line px-5 py-4">
          <h2 id="create-lead-title" className="text-base font-bold text-dashboard-ink">Nuevo lead</h2>
          <button type="button" className="rounded-md p-1.5 hover:bg-slate-100" onClick={onClose}>
            <XCircle className="h-5 w-5 text-dashboard-muted" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">
            Nombre
            <input
              ref={firstInputRef}
              className="mt-1 h-10 w-full rounded-lg border border-dashboard-line px-3 text-sm outline-none focus:border-dashboard-primary"
              value={draft.fullName}
              onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium">
            Telefono
            <input
              className="mt-1 h-10 w-full rounded-lg border border-dashboard-line px-3 text-sm outline-none focus:border-dashboard-primary"
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium">
            Valor estimado
            <input
              className="mt-1 h-10 w-full rounded-lg border border-dashboard-line px-3 text-sm outline-none focus:border-dashboard-primary"
              inputMode="numeric"
              value={draft.pipelineValue ? String(draft.pipelineValue) : ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, pipelineValue: Number(event.target.value.replace(/\D/g, "") || 0) }))
              }
            />
          </label>
          <label className="text-sm font-medium">
            Procedimiento
            <input
              className="mt-1 h-10 w-full rounded-lg border border-dashboard-line px-3 text-sm outline-none focus:border-dashboard-primary"
              value={draft.procedureInterest}
              onChange={(event) => setDraft((current) => ({ ...current, procedureInterest: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium">
            Asesora inicial
            <select
              className="mt-1 h-10 w-full rounded-lg border border-dashboard-line bg-white px-3 text-sm outline-none focus:border-dashboard-primary"
              value={draft.assignedAgentId}
              onChange={(event) => setDraft((current) => ({ ...current, assignedAgentId: event.target.value }))}
            >
              <option value="">Sin asignar</option>
              {activeAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-dashboard-line px-5 py-4">
          <button
            type="button"
            className="rounded-md border border-dashboard-line px-3 py-2 text-sm font-bold text-dashboard-muted"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-dashboard-primary px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Crear lead
          </button>
        </div>
      </form>
    </div>
  );
};

const AttributionView = ({
  leads,
  onSelect,
}: {
  leads: DashboardLead[];
  onSelect: (lead: DashboardLead) => void;
}) => {
  const rows = buildAttributionRows(leads);
  const totalLeads = leads.length;
  const totalEvaluations = rows.reduce((sum, row) => sum + row.evaluations, 0);
  const totalWon = rows.reduce((sum, row) => sum + row.won, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
  const recentLeads = [...leads]
    .sort((firstLead, secondLead) => Date.parse(secondLead.createdAt) - Date.parse(firstLead.createdAt))
    .slice(0, 40);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile metric={{ id: "attr-leads", label: "Leads atribuidos", value: totalLeads, tone: "blue" }} />
        <MetricTile metric={{ id: "attr-evals", label: "Evaluaciones", value: totalEvaluations, tone: "green" }} />
        <MetricTile metric={{ id: "attr-won", label: "Ganados", value: totalWon, tone: "green" }} />
        <MetricTile
          metric={{
            id: "attr-value",
            label: "Valor ganado",
            value: totalValue,
            format: "currency",
            tone: "blue",
          }}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold">Fuentes y conversiones</h2>
            <p className="mt-1 text-sm text-slate-500">Origen real desde UTMs, referrer y clics pagados.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Fuente</th>
                <th className="px-5 py-3">Medio</th>
                <th className="px-5 py-3 text-right">Leads</th>
                <th className="px-5 py-3 text-right">Evaluaciones</th>
                <th className="px-5 py-3 text-right">Cirugias</th>
                <th className="px-5 py-3 text-right">Ganados</th>
                <th className="px-5 py-3 text-right">Lead a eval.</th>
                <th className="px-5 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900">{row.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{row.source}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{row.medium}</td>
                  <td className="px-5 py-3 text-right font-semibold">{row.leads}</td>
                  <td className="px-5 py-3 text-right">{row.evaluations}</td>
                  <td className="px-5 py-3 text-right">{row.surgeries}</td>
                  <td className="px-5 py-3 text-right">{row.won}</td>
                  <td className="px-5 py-3 text-right">
                    {row.leads ? `${Math.round((row.evaluations / row.leads) * 100)}%` : "0%"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? (
          <p className="border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-500">
            Todavia no hay leads en el periodo seleccionado.
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold">Detalle de leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Lead</th>
                <th className="px-5 py-3">Fuente</th>
                <th className="px-5 py-3">Campana</th>
                <th className="px-5 py-3">Landing</th>
                <th className="px-5 py-3">Etapa</th>
                <th className="px-5 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLeads.map((lead) => {
                const attribution = getLeadAttribution(lead);

                return (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        className="text-left font-semibold text-dashboard-primary hover:underline"
                        onClick={() => onSelect(lead)}
                      >
                        {lead.fullName}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDate(lead.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{getAttributionLabel(attribution)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {attribution.source || "direct"} / {attribution.medium || "direct"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{attribution.campaign || "Sin campana"}</td>
                    <td className="max-w-[260px] truncate px-5 py-3 text-slate-600">
                      {attribution.landingPage || lead.sourceUrl || "Sin dato"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{lead.pipelineStage}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatCurrency(lead.pipelineValue || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const TeamSettings = ({
  settings,
  agentPerformance,
  agentStatuses,
  onRefresh,
  onSessionExpired,
  onDirtyChange,
}: {
  settings: AgentSettings | null;
  agentPerformance: DashboardSnapshot["agentPerformance"];
  agentStatuses: DashboardSnapshot["agentStatuses"];
  onRefresh: (options?: RefreshOptions) => void;
  onSessionExpired: () => Promise<void>;
  onDirtyChange: (hasUnsavedChanges: boolean) => void;
}) => {
  const [draft, setDraft] = useState<AgentSettings>(() => settings || emptyTeamSettings);
  const [lastSyncedKey, setLastSyncedKey] = useState<string | null>(() =>
    settings ? serializeTeamSettings(settings) : null,
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTogglingQueue, setIsTogglingQueue] = useState(false);
  const [draggingAgentIndex, setDraggingAgentIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const settingsKey = useMemo(() => (settings ? serializeTeamSettings(settings) : null), [settings]);
  const draftKey = useMemo(() => serializeTeamSettings(draft), [draft]);
  const hasUnsavedChanges = Boolean(lastSyncedKey && draftKey !== lastSyncedKey);
  const isSavingAny = isSavingSettings || isTogglingQueue;

  useEffect(() => {
    if (!settings || !settingsKey) {
      return;
    }

    if (draftKey === lastSyncedKey || draftKey === settingsKey) {
      setDraft(settings);
      setLastSyncedKey(settingsKey);
    }
  }, [draftKey, lastSyncedKey, settings, settingsKey]);

  useEffect(() => {
    onDirtyChange(hasUnsavedChanges);

    return () => {
      onDirtyChange(false);
    };
  }, [hasUnsavedChanges, onDirtyChange]);

  const discardChanges = () => {
    const nextDraft = settings || emptyTeamSettings;

    setDraft(nextDraft);
    setLastSyncedKey(settings ? serializeTeamSettings(settings) : serializeTeamSettings(nextDraft));
    setError("");
  };

  const updateAgent = (
    index: number,
    key: "name" | "phone" | "email" | "active" | "accountActive" | "password",
    value: string | boolean,
  ) => {
    setDraft((current) => ({
      ...current,
      agents: current.agents.map((agent, agentIndex) =>
        agentIndex === index ? { ...agent, [key]: value } : agent,
      ),
    }));
  };

  const removeAgent = (index: number) => {
    setDraft((current) => ({
      ...current,
      agents: current.agents.filter((_, agentIndex) => agentIndex !== index),
    }));
  };

  const moveAgent = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }

    setDraft((current) => {
      const nextAgents = [...current.agents];
      const [movedAgent] = nextAgents.splice(fromIndex, 1);

      if (!movedAgent) {
        return current;
      }

      nextAgents.splice(toIndex, 0, movedAgent);

      return {
        ...current,
        agents: nextAgents,
      };
    });
  };

  const validateTeamSettings = () => {
    if (!draft.businessTimeZone.trim()) {
      return "Selecciona una zona horaria.";
    }

    const invalidAgent = draft.agents.find((agent) => {
      const hasName = Boolean(agent.name.trim());
      const hasPhone = Boolean(agent.phone.trim());

      return !hasName || !hasPhone || !isValidAgentPhone(agent.phone);
    });

    if (invalidAgent) {
      return "Cada asesora debe tener nombre y un telefono valido, por ejemplo +56912345678.";
    }

    const invalidEmailAgent = draft.agents.find(
      (agent) => agent.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agent.email.trim()),
    );

    if (invalidEmailAgent) {
      return "El email de cada asesora debe tener un formato valido.";
    }

    const missingEmailAgent = draft.agents.find((agent) => !agent.email?.trim());

    if (missingEmailAgent) {
      return "Cada asesora debe tener email para vincular su cuenta del dashboard.";
    }

    return "";
  };

  const saveSettings = async () => {
    const validationError = validateTeamSettings();

    if (validationError) {
      setError(validationError);
      showActionToast("warning", validationError);
      return;
    }

    setIsSavingSettings(true);
    setError("");

    try {
      const data = await apiRequest<AgentSettings>("/api/cirugia360-speed/dashboard?resource=sales-agents", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      const nextKey = serializeTeamSettings(data);

      setDraft(data);
      setLastSyncedKey(nextKey);
      onRefresh({ force: true });
      showActionToast(
        "success",
        "Equipo actualizado.",
        "Los cambios ya están vigentes para las próximas llamadas.",
      );
    } catch (saveError) {
      if (isSessionExpiredError(saveError)) {
        await onSessionExpired();
        return;
      }

      const message = saveError instanceof Error ? saveError.message : "No pudimos guardar.";
      setError(message);
      showActionToast("error", "No pudimos guardar el equipo.", message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const toggleQueue = async () => {
    const nextPaused = !draft.queuePaused;

    setIsTogglingQueue(true);
    setError("");

    try {
      const data = await apiRequest<AgentSettings>("/api/cirugia360-speed/dashboard?resource=queue-control", {
        method: "POST",
        body: JSON.stringify({
          action: nextPaused ? "pause" : "resume",
        }),
      });
      const nextKey = serializeTeamSettings(data);

      setDraft(data);
      setLastSyncedKey(nextKey);
      onRefresh({ force: true });
      showActionToast(
        "success",
        nextPaused ? "Cola pausada." : "Cola reanudada.",
        nextPaused
          ? "La cola deja de entregar nuevos leads hasta que la reanudes."
          : "La cola volvió a entregar leads a las asesoras activas.",
      );
    } catch (saveError) {
      if (isSessionExpiredError(saveError)) {
        await onSessionExpired();
        return;
      }

      const message = saveError instanceof Error ? saveError.message : "No pudimos cambiar la cola.";
      setError(message);
      showActionToast("error", "No pudimos cambiar la cola.", message);
    } finally {
      setIsTogglingQueue(false);
    }
  };

  return (
    <section className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {isSavingAny ? (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/60 backdrop-blur-[1px]">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <RefreshCcw className="h-4 w-4 animate-spin" />
            Guardando cambios...
          </div>
        </div>
      ) : null}

      {hasUnsavedChanges ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <span className="font-medium">
            Tenés cambios sin guardar. No cerramos ni refrescamos hasta que los guardes o descartes.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void saveSettings()}
              disabled={isSavingAny}
            >
              {isSavingSettings ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : null}
              {isSavingSettings ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={discardChanges}
              disabled={isSavingAny}
            >
              Descartar
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Equipo</h2>
          <p className="text-sm text-slate-500">Asesoras, prioridad, cuentas y zona horaria</p>
        </div>
      </div>

      <label className="mt-5 block max-w-sm text-sm font-medium">
        Zona horaria
        <select
          className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={draft.businessTimeZone}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              businessTimeZone: event.target.value,
            }))
          }
        >
          {businessTimeZoneOptions.map((timeZone) => (
            <option key={timeZone} value={timeZone}>
              {timeZone}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 space-y-3">
        {draft.agents.map((agent, index) => (
          <div
            key={agent.id || index}
            className={`grid gap-3 rounded-lg border p-3 transition md:grid-cols-[auto_1fr_1fr_1fr_1fr_auto_auto_auto] ${
              draggingAgentIndex === index ? "border-dashboard-primary bg-dashboard-soft/60" : "border-slate-200"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const fromIndex = Number(event.dataTransfer.getData("text/plain"));

              if (Number.isInteger(fromIndex)) {
                moveAgent(fromIndex, index);
              }

              setDraggingAgentIndex(null);
            }}
          >
            <button
              type="button"
              draggable
              className="inline-flex h-10 w-10 cursor-grab items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 active:cursor-grabbing"
              title="Arrastrar prioridad"
              onDragStart={(event) => {
                setDraggingAgentIndex(index);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragEnd={() => setDraggingAgentIndex(null)}
            >
              <GripVertical className="h-4 w-4" />
              <span className="sr-only">Arrastrar prioridad {index + 1}</span>
            </button>
            <input
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={agent.name}
              onChange={(event) => updateAgent(index, "name", event.target.value)}
              placeholder="Nombre"
            />
            <input
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={agent.phone}
              onChange={(event) => updateAgent(index, "phone", event.target.value)}
              placeholder="+569..."
            />
            <input
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={agent.email || ""}
              onChange={(event) => updateAgent(index, "email", event.target.value)}
              placeholder="email@clinica.cl"
            />
            <input
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={agent.password || ""}
              onChange={(event) => updateAgent(index, "password", event.target.value)}
              placeholder={agent.authUserId ? "Nueva contrasena" : "Contrasena inicial"}
              type="password"
              autoComplete="new-password"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={agent.active !== false}
                onChange={(event) => updateAgent(index, "active", event.target.checked)}
              />
              Activa
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={agent.accountActive !== false}
                onChange={(event) => updateAgent(index, "accountActive", event.target.checked)}
              />
              Cuenta
            </label>
            {agent.active === false && agent.lastAutoDeactivation?.reason ? (
              <p className="text-xs leading-5 text-amber-700 md:col-span-full md:pl-[52px]">
                Desactivada a las {formatDate(agent.lastAutoDeactivation.at)} - {agent.lastAutoDeactivation.reason}
                {agent.lastAutoDeactivation.leadName ? ` a ${agent.lastAutoDeactivation.leadName}` : ""}
              </p>
            ) : null}
            <p className="text-xs leading-5 text-slate-600 md:col-span-full md:pl-[52px]">
              Últimos 7 días: {formatHoursMinutes(agent.activityAverageSeconds)}
            </p>
            <button
              type="button"
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
              onClick={() => removeAgent(index)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              agents: [
                ...current.agents,
                {
                  id: `agent-${current.agents.length + 1}`,
                  name: "",
                  phone: "",
                  email: "",
                  active: true,
                  accountActive: true,
                },
              ],
            }))
          }
        >
          Agregar asesora
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={saveSettings}
          disabled={isSavingAny}
        >
          {isSavingSettings ? (
            <RefreshCcw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSavingSettings ? "Guardando..." : "Guardar equipo"}
        </button>
      </div>

      {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <section className="mt-6 border-t border-slate-200 pt-5">
        <div className="mb-3">
          <h3 className="text-base font-semibold">Estado en vivo</h3>
          <p className="text-sm text-slate-500">Disponibilidad actual segun prioridad.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(agentStatuses || []).map((agent) => {
            const statusCopy =
              agent.status === "busy"
                ? { label: "Activa, en llamada", dot: "bg-amber-400", card: "border-amber-200 bg-amber-50" }
                : agent.status === "free"
                  ? { label: "Activa y libre", dot: "bg-emerald-500", card: "border-emerald-200 bg-emerald-50" }
                  : { label: "Inactiva", dot: "bg-slate-500", card: "border-slate-200 bg-slate-50" };

            return (
              <article key={agent.id} className={`rounded-lg border p-3 ${statusCopy.card}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{agent.priority}. {agent.name}</p>
                    {agent.email ? <p className="text-xs text-slate-500">{agent.email}</p> : null}
                  </div>
                  <span className={`h-3 w-3 rounded-full ${statusCopy.dot}`} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">{statusCopy.label}</p>
                {agent.activeLeadName ? (
                  <p className="mt-1 text-xs text-slate-600">Atendiendo a {agent.activeLeadName}</p>
                ) : null}
                {agent.status === "inactive" && agent.lastAutoDeactivation?.reason ? (
                  <p className="mt-2 text-xs leading-5 text-amber-800">
                    Última auto-desactivación: {formatDate(agent.lastAutoDeactivation.at)} - {agent.lastAutoDeactivation.reason}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 border-t border-slate-200 pt-5">
        <div className="mb-3">
          <h3 className="text-base font-semibold">Rendimiento</h3>
          <p className="text-sm text-slate-500">Metricas por asesora en el periodo activo.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="py-2 pr-3">Asesora</th>
                <th scope="col" className="px-3 py-2">Leads</th>
                <th scope="col" className="px-3 py-2">Contactados</th>
                <th scope="col" className="px-3 py-2">Evaluaciones</th>
                <th scope="col" className="px-3 py-2">Cirugias</th>
                <th scope="col" className="px-3 py-2">Ganados</th>
                <th scope="col" className="px-3 py-2">Actividad 7d</th>
                <th scope="col" className="px-3 py-2">Conversion</th>
                <th scope="col" className="px-3 py-2">Tiempo prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(agentPerformance || []).map((agent) => (
                <tr key={agent.id}>
                  <th scope="row" className="py-3 pr-3 font-semibold text-slate-900">
                    {agent.name}
                    {agent.email ? <span className="block text-xs font-normal text-slate-500">{agent.email}</span> : null}
                  </th>
                  <td className="px-3 py-3">{agent.assigned}</td>
                  <td className="px-3 py-3">{agent.contacted}</td>
                  <td className="px-3 py-3">{agent.evaluations}</td>
                  <td className="px-3 py-3">{agent.surgeries}</td>
                  <td className="px-3 py-3">{agent.won}</td>
                  <td className="px-3 py-3">{formatHoursMinutes(agent.activityAverageSeconds)}</td>
                  <td className="px-3 py-3">{agent.conversionRate}%</td>
                  <td className="px-3 py-3">{formatMetric({ id: "agent-speed", label: "", value: agent.averageTimeToContactSeconds, format: "duration" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {agentPerformance?.length ? null : (
          <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            No hay leads asignados en este periodo.
          </p>
        )}
      </section>
    </section>
  );
};

const Cirugia360Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [selectedLead, setSelectedLead] = useState<DashboardLead | null>(null);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [error, setError] = useState("");
  const [authBanner, setAuthBanner] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTeamSettingsDirty, setIsTeamSettingsDirty] = useState(false);
  const [updatingPipelineLeadId, setUpdatingPipelineLeadId] = useState<string | null>(null);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);
  const [isTogglingOwnStatus, setIsTogglingOwnStatus] = useState(false);
  const [period, setPeriod] = useState<DashboardPeriod>("7d");
  const [customRange, setCustomRange] = useState({
    dateFrom: toDateInputValue(new Date()),
    dateTo: toDateInputValue(new Date()),
  });
  const leadDetailReturnFocusRef = useRef<HTMLElement | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const realtimeRefreshTimerRef = useRef<number | null>(null);
  const sessionUserIdRef = useRef<string | null>(null);
  const isTeamSettingsDirtyRef = useRef(false);
  const userId = session?.user.id || null;

  const resetDashboardState = useCallback(() => {
    isTeamSettingsDirtyRef.current = false;
    setSnapshot(null);
    setSettings(null);
    setSelectedLead(null);
    setIsCreateLeadOpen(false);
    setError("");
    setIsLoading(false);
    setIsTeamSettingsDirty(false);
    setUpdatingPipelineLeadId(null);
    setCallingLeadId(null);
    setActiveView("overview");
  }, []);

  const handleTeamDirtyChange = useCallback((hasUnsavedChanges: boolean) => {
    isTeamSettingsDirtyRef.current = hasUnsavedChanges;
    setIsTeamSettingsDirty(hasUnsavedChanges);
  }, []);

  useEffect(() => {
    const configError = getDashboardSupabaseConfigError();

    if (configError) {
      setIsAuthReady(true);
      return;
    }

    return subscribeDashboardSession((nextSession) => {
      setIsAuthReady(true);
      const nextUserId = nextSession?.user.id || null;

      if (sessionUserIdRef.current !== nextUserId) {
        resetDashboardState();
        sessionUserIdRef.current = nextUserId;
      }

      setSession((currentSession) => {
        const currentUserId = currentSession?.user.id || null;

        return currentUserId === nextUserId ? currentSession : nextSession;
      });
      if (nextSession) {
        setAuthBanner("");
      }
    });
  }, [resetDashboardState]);

  const expireDashboardSession = useCallback(async () => {
    setAuthBanner("Tu sesión expiró, vuelve a iniciar.");
    resetDashboardState();
    setSession(null);
    await getDashboardSupabase().auth.signOut();
  }, [resetDashboardState]);

  const dashboardDateRange = useMemo(() => getDashboardDateRange(period, customRange), [customRange, period]);

  const refresh = useCallback(async (options: RefreshOptions = {}) => {
    if (!userId) {
      return;
    }

    if (isTeamSettingsDirtyRef.current && !options.force) {
      if (!options.silent) {
        showActionToast("warning", "Tenés cambios sin guardar.", "Guarda o descarta los cambios de Equipo antes de actualizar.");
      }
      return;
    }

    if (!options.silent) {
      setIsLoading(true);
    }
    setError("");

    try {
      const dashboardParams = new URLSearchParams();

      if (dashboardDateRange.dateFrom) {
        dashboardParams.set("dateFrom", dashboardDateRange.dateFrom);
      }

      if (dashboardDateRange.dateTo) {
        dashboardParams.set("dateTo", dashboardDateRange.dateTo);
      }

      const dashboardPath = `/api/cirugia360-speed/dashboard${
        dashboardParams.toString() ? `?${dashboardParams.toString()}` : ""
      }`;
      const [dashboardResult, settingsResult] = await Promise.allSettled([
        apiRequest<DashboardSnapshot>(dashboardPath),
        apiRequest<AgentSettings>("/api/cirugia360-speed/dashboard?resource=sales-agents"),
      ]);

      if (dashboardResult.status === "rejected" && isSessionExpiredError(dashboardResult.reason)) {
        await expireDashboardSession();
        return;
      }

      if (settingsResult.status === "rejected" && isSessionExpiredError(settingsResult.reason)) {
        await expireDashboardSession();
        return;
      }

      if (dashboardResult.status === "fulfilled") {
        setSnapshot(dashboardResult.value);
        setSelectedLead((currentLead) =>
          currentLead ? dashboardResult.value.leads.find((lead) => lead.id === currentLead.id) || null : null,
        );
      }

      if (settingsResult.status === "fulfilled") {
        setSettings(settingsResult.value);
      }

      if (dashboardResult.status === "rejected") {
        throw dashboardResult.reason;
      }

      if (settingsResult.status === "rejected") {
        setError(`No pudimos cargar Equipo: ${getDashboardErrorMessage(settingsResult.reason, "Revisa la configuracion de asesoras.")}`);
      }
    } catch (loadError) {
      if (isSessionExpiredError(loadError)) {
        await expireDashboardSession();
        return;
      }

      setError(getDashboardErrorMessage(loadError, "No pudimos cargar el dashboard."));
    } finally {
      if (!options.silent) {
        setIsLoading(false);
      }
    }
  }, [dashboardDateRange.dateFrom, dashboardDateRange.dateTo, expireDashboardSession, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!snapshot?.viewer?.role) {
      return;
    }

    const allowedItems = roleVisibleNavItems(snapshot.viewer.role);

    if (!allowedItems.some((item) => item.id === activeView)) {
      setActiveView(allowedItems[0]?.id || "pipeline");
    }
  }, [activeView, snapshot?.viewer?.role]);

  useEffect(() => {
    if (!isTeamSettingsDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "Tenés cambios sin guardar, ¿salir de todos modos?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isTeamSettingsDirty]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const clearPollingTimer = () => {
      if (pollingTimerRef.current !== null) {
        window.clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };

    const schedulePolling = () => {
      clearPollingTimer();
      const intervalMs = document.visibilityState === "visible" ? 60_000 : 180_000;

      pollingTimerRef.current = window.setTimeout(() => {
        void refresh({ silent: true }).finally(schedulePolling);
      }, intervalMs);
    };

    const handleVisibilityChange = () => {
      schedulePolling();
    };

    schedulePolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearPollingTimer();
    };
  }, [refresh, userId]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const supabase = getDashboardSupabase();
    const channel = supabase
      .channel("c360-speed-leads-inserts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "c360_speed_leads",
        },
        () => {
          if (realtimeRefreshTimerRef.current !== null) {
            window.clearTimeout(realtimeRefreshTimerRef.current);
          }

          realtimeRefreshTimerRef.current = window.setTimeout(() => {
            void refresh({ silent: true });
          }, 750);
        },
      )
      .subscribe();

    return () => {
      if (realtimeRefreshTimerRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
        realtimeRefreshTimerRef.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  const signOut = async () => {
    resetDashboardState();
    await getDashboardSupabase().auth.signOut();
    setAuthBanner("");
  };

  const toggleOwnAgentStatus = async () => {
    const nextActive = currentAgent?.active === false;

    setIsTogglingOwnStatus(true);
    setError("");

    try {
      const result = await apiRequest<{ settings: AgentSettings }>("/api/cirugia360-speed/dashboard?resource=agent-status", {
        method: "POST",
        body: JSON.stringify({ active: nextActive }),
      });

      setSettings(result.settings);
      await refresh({ silent: true, force: true });
      showActionToast(
        "success",
        nextActive ? "Quedaste activa." : "Quedaste inactiva.",
        nextActive ? "Revisamos la cola para asignar llamadas pendientes." : undefined,
      );
    } catch (statusError) {
      if (isSessionExpiredError(statusError)) {
        await expireDashboardSession();
        return;
      }

      const message = getDashboardErrorMessage(statusError, "No pudimos cambiar tu estado.");
      setError(message);
      showActionToast("error", "No pudimos cambiar tu estado.", message);
    } finally {
      setIsTogglingOwnStatus(false);
    }
  };

  const openLeadDetail = useCallback((lead: DashboardLead) => {
    leadDetailReturnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedLead(lead);
  }, []);

  const closeLeadDetail = useCallback(() => {
    setSelectedLead(null);
    window.setTimeout(() => {
      leadDetailReturnFocusRef.current?.focus();
      leadDetailReturnFocusRef.current = null;
    }, 0);
  }, []);

  const patchLead = useCallback((leadId: string, patch: Partial<DashboardLead>) => {
    setSnapshot((currentSnapshot) => {
      if (!currentSnapshot) {
        return currentSnapshot;
      }

      const nextLeads = currentSnapshot.leads.map((lead) =>
        lead.id === leadId ? { ...lead, ...patch } : lead,
      );

      return withLeads(currentSnapshot, nextLeads);
    });
    setSelectedLead((currentLead) =>
      currentLead?.id === leadId ? { ...currentLead, ...patch } : currentLead,
    );
  }, []);

  const restoreSnapshot = useCallback((previousSnapshot: DashboardSnapshot | null) => {
    setSnapshot(previousSnapshot);
    setSelectedLead((currentLead) =>
      currentLead && previousSnapshot
        ? previousSnapshot.leads.find((lead) => lead.id === currentLead.id) || null
        : currentLead,
    );
  }, []);

  const reconcileAfterFailure = useCallback(
    async (previousSnapshot: DashboardSnapshot | null) => {
      restoreSnapshot(previousSnapshot);
      await refresh();
    },
    [refresh, restoreSnapshot],
  );

  const updateStage = async (leadId: string, stage: string, options: ActionOptions = {}) => {
    setError("");
    setUpdatingPipelineLeadId(leadId);
    const previousSnapshot = snapshot;
    patchLead(leadId, { pipelineStage: stage });

    try {
      await apiRequest("/api/cirugia360-speed/pipeline-stage", {
        method: "POST",
        body: JSON.stringify({
          action: "stage",
          leadId,
          stage,
        }),
      });
      if (!options.skipToast) {
        showActionToast("success", "Etapa actualizada.");
      }
      return true;
    } catch (stageError) {
      if (isSessionExpiredError(stageError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(stageError, "No pudimos actualizar la etapa.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);
      if (!options.skipToast) {
        showActionToast("error", "No pudimos actualizar la etapa.", message);
      }
      return false;
    } finally {
      setUpdatingPipelineLeadId(null);
    }
  };

  const callLead = async (leadId: string, options: ActionOptions = {}) => {
    setError("");
    setCallingLeadId(leadId);
    const previousSnapshot = snapshot;
    patchLead(leadId, {
      status: "dispatching",
      salesCallStatus: "dispatching",
      lastError: null,
    });

    try {
      const result = await apiRequest<LeadCallResult>("/api/cirugia360-speed/dashboard?resource=lead-call", {
        method: "POST",
        body: JSON.stringify({ leadId }),
      });
      patchLead(leadId, {
        status: result.queued ? "scheduled" : "dispatching",
        salesCallStatus: result.queued ? "scheduled" : "dispatching",
        dispatchScheduledAt: result.dispatchScheduledAt || null,
        ...(result.assignedAgent ? { assignedAgentName: result.assignedAgent } : {}),
      });
      if (!options.skipToast) {
        showActionToast(
          result.warning ? "warning" : "success",
          result.queued ? "Llamada reprogramada." : "Llamada solicitada.",
          result.warning,
        );
      }
      return true;
    } catch (callError) {
      if (isSessionExpiredError(callError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(callError, "No pudimos iniciar la llamada.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);
      if (!options.skipToast) {
        showActionToast("error", "No pudimos iniciar la llamada.", message);
      }
      return false;
    } finally {
      setCallingLeadId(null);
    }
  };

  const createLead = async (payload: CreateLeadPayload) => {
    setError("");

    try {
      const lead = await apiRequest<DashboardLead>("/api/cirugia360-speed/lead", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSnapshot((currentSnapshot) => {
        if (!currentSnapshot) {
          return currentSnapshot;
        }

        return withLeads(currentSnapshot, [lead, ...currentSnapshot.leads]);
      });
      showActionToast("success", "Lead creado.", lead.fullName);
      return true;
    } catch (createError) {
      if (isSessionExpiredError(createError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(createError, "No se pudo crear el lead.");
      setError(message);
      showActionToast("error", "No se pudo crear el lead.", message);
      return false;
    }
  };

  const updateOutcome = async (
    leadId: string,
    outcome: "active" | "lost" | "won",
    reason = "",
    options: ActionOptions = {},
  ) => {
    setError("");
    setUpdatingPipelineLeadId(leadId);
    const previousSnapshot = snapshot;
    const previousLead = previousSnapshot?.leads.find((lead) => lead.id === leadId) || null;
    const previousOutcome = (previousLead?.pipelineOutcome || "active") as "active" | "lost" | "won";
    const previousReasonCode = (previousLead?.pipelineOutcomeReasonCode as LossReasonCode | null) || null;
    const previousReason = previousLead?.pipelineOutcomeReason || "";
    const nextReasonCode = outcome === "lost" ? options.reasonCode || null : null;
    patchLead(leadId, {
      pipelineOutcome: outcome,
      pipelineOutcomeReasonCode: nextReasonCode,
      pipelineOutcomeReason: outcome === "lost" ? reason : null,
    });

    try {
      await apiRequest("/api/cirugia360-speed/pipeline-stage", {
        method: "POST",
        body: JSON.stringify({
          action: "outcome",
          leadId,
          outcome,
          reasonCode: nextReasonCode,
          reason: outcome === "lost" ? reason : null,
        }),
      });
      if (!options.skipToast && !options.skipUndoToast && previousLead && previousOutcome !== outcome) {
        const outcomeLabels: Record<"active" | "lost" | "won", string> = {
          active: "activa",
          lost: "perdida",
          won: "ganada",
        };

        toast.success(`Oportunidad ${outcomeLabels[outcome]}`, {
          description: previousLead.fullName,
          duration: 6000,
          action: {
            label: "Deshacer",
            onClick: () => {
              void updateOutcome(leadId, previousOutcome, previousReason, {
                skipUndoToast: true,
                reasonCode: previousOutcome === "lost" ? previousReasonCode : null,
              });
            },
          },
        });
      }
      return true;
    } catch (outcomeError) {
      if (isSessionExpiredError(outcomeError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(outcomeError, "No pudimos actualizar la oportunidad.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);
      if (!options.skipToast) {
        showActionToast("error", "No pudimos actualizar la oportunidad.", message);
      }
      return false;
    } finally {
      setUpdatingPipelineLeadId(null);
    }
  };

  const updatePipelineValue = async (leadId: string, pipelineValue: number, options: ActionOptions = {}) => {
    setError("");
    setUpdatingPipelineLeadId(leadId);
    const previousSnapshot = snapshot;
    patchLead(leadId, { pipelineValue });

    try {
      await apiRequest("/api/cirugia360-speed/pipeline-stage", {
        method: "POST",
        body: JSON.stringify({
          action: "value",
          leadId,
          pipelineValue,
        }),
      });
      if (!options.skipToast) {
        showActionToast("success", "Valor comercial guardado.");
      }
      return true;
    } catch (valueError) {
      if (isSessionExpiredError(valueError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(valueError, "No pudimos guardar el valor.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);
      if (!options.skipToast) {
        showActionToast("error", "No pudimos guardar el valor.", message);
      }
      return false;
    } finally {
      setUpdatingPipelineLeadId(null);
    }
  };

  const updateAssignedAgent = async (leadId: string, assignedAgentId: string, options: ActionOptions = {}) => {
    setError("");
    const previousSnapshot = snapshot;
    const agent = settings?.agents.find((currentAgent) => currentAgent.id === assignedAgentId) || null;
    patchLead(leadId, { assignedAgentName: agent?.name || null, assignedAgentEmail: agent?.email || null });

    try {
      const updatedLead = await apiRequest<DashboardLead>("/api/cirugia360-speed/lead", {
        method: "PATCH",
        body: JSON.stringify({
          leadId,
          assignedAgentId: assignedAgentId || null,
        }),
      });
      patchLead(leadId, {
        assignedAgentName: updatedLead.assignedAgentName,
        assignedAgentEmail: updatedLead.assignedAgentEmail,
      });

      if (!options.skipToast) {
        showActionToast("success", "Asesora actualizada.");
      }

      return true;
    } catch (agentError) {
      if (isSessionExpiredError(agentError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(agentError, "No pudimos actualizar la asesora.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);

      if (!options.skipToast) {
        showActionToast("error", "No pudimos actualizar la asesora.", message);
      }

      return false;
    }
  };

  const updateCallback = async (
    leadId: string,
    callbackTime: string | null,
    callbackContext: string,
    options: ActionOptions = {},
  ) => {
    setError("");
    const previousSnapshot = snapshot;
    const previousLead = previousSnapshot?.leads.find((lead) => lead.id === leadId) || null;
    const nextPatch: Partial<DashboardLead> = {
      dispatchScheduledAt: callbackTime,
      callbackContext: callbackTime ? callbackContext.trim() || null : null,
      status: callbackTime ? "scheduled" : previousLead?.status === "scheduled" ? "received" : previousLead?.status || "received",
      salesCallStatus: callbackTime ? "scheduled" : previousLead?.status === "scheduled" ? null : previousLead?.salesCallStatus || null,
      lastError: callbackTime ? null : previousLead?.lastError || null,
    };

    patchLead(leadId, nextPatch);

    try {
      const updatedLead = await apiRequest<DashboardLead>("/api/cirugia360-speed/lead", {
        method: "PATCH",
        body: JSON.stringify({
          leadId,
          callbackTime,
          callbackContext: callbackContext.trim() || null,
        }),
      });
      patchLead(leadId, {
        dispatchScheduledAt: updatedLead.dispatchScheduledAt,
        callbackContext: updatedLead.callbackContext,
        status: updatedLead.status,
        salesCallStatus: updatedLead.salesCallStatus,
        lastError: updatedLead.lastError,
      });

      if (!options.skipToast) {
        showActionToast(
          "success",
          callbackTime ? "Rellamada programada." : "Rellamada cancelada.",
          callbackTime ? formatDate(callbackTime) : undefined,
        );
      }

      return true;
    } catch (callbackError) {
      if (isSessionExpiredError(callbackError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(callbackError, "No pudimos guardar la rellamada.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);

      if (!options.skipToast) {
        showActionToast("error", "No pudimos guardar la rellamada.", message);
      }

      return false;
    }
  };

  const addLeadNote = async (leadId: string, body: string, options: ActionOptions = {}) => {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return false;
    }

    setError("");
    const previousSnapshot = snapshot;
    const pendingNote: LeadNote = {
      id: -Date.now(),
      createdAt: new Date().toISOString(),
      authorEmail: session?.user.email || null,
      body: trimmedBody,
    };

    setSnapshot((currentSnapshot) => {
      if (!currentSnapshot) {
        return currentSnapshot;
      }

      const nextLeads = currentSnapshot.leads.map((lead) =>
        lead.id === leadId ? { ...lead, notes: [pendingNote, ...lead.notes] } : lead,
      );

      return withLeads(currentSnapshot, nextLeads);
    });
    setSelectedLead((currentLead) =>
      currentLead?.id === leadId ? { ...currentLead, notes: [pendingNote, ...currentLead.notes] } : currentLead,
    );

    try {
      const savedNote = await apiRequest<LeadNote>("/api/cirugia360-speed/dashboard?resource=lead-note", {
        method: "POST",
        body: JSON.stringify({
          leadId,
          body: trimmedBody,
        }),
      });
      setSnapshot((currentSnapshot) => {
        if (!currentSnapshot) {
          return currentSnapshot;
        }

        const nextLeads = currentSnapshot.leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                notes: lead.notes.map((leadNote) => (leadNote.id === pendingNote.id ? savedNote : leadNote)),
              }
            : lead,
        );

        return withLeads(currentSnapshot, nextLeads);
      });
      setSelectedLead((currentLead) =>
        currentLead?.id === leadId
          ? {
              ...currentLead,
              notes: currentLead.notes.map((leadNote) => (leadNote.id === pendingNote.id ? savedNote : leadNote)),
            }
          : currentLead,
      );
      if (!options.skipToast) {
        showActionToast("success", "Nota guardada.");
      }
      return true;
    } catch (noteError) {
      if (isSessionExpiredError(noteError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(noteError, "No pudimos guardar la nota.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);
      if (!options.skipToast) {
        showActionToast("error", "No pudimos guardar la nota.", message);
      }
      return false;
    }
  };

  const updateLeadNote = async (leadId: string, noteId: number, body: string, options: ActionOptions = {}) => {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return false;
    }

    setError("");
    const previousSnapshot = snapshot;
    const patchNote = (leadNote: LeadNote): LeadNote =>
      leadNote.id === noteId ? { ...leadNote, body: trimmedBody, updatedAt: new Date().toISOString() } : leadNote;

    setSnapshot((currentSnapshot) => {
      if (!currentSnapshot) {
        return currentSnapshot;
      }

      const nextLeads = currentSnapshot.leads.map((lead) =>
        lead.id === leadId ? { ...lead, notes: lead.notes.map(patchNote) } : lead,
      );

      return withLeads(currentSnapshot, nextLeads);
    });
    setSelectedLead((currentLead) =>
      currentLead?.id === leadId ? { ...currentLead, notes: currentLead.notes.map(patchNote) } : currentLead,
    );

    try {
      const savedNote = await apiRequest<LeadNote>("/api/cirugia360-speed/dashboard?resource=lead-note", {
        method: "PATCH",
        body: JSON.stringify({
          noteId,
          body: trimmedBody,
        }),
      });
      setSnapshot((currentSnapshot) => {
        if (!currentSnapshot) {
          return currentSnapshot;
        }

        const nextLeads = currentSnapshot.leads.map((lead) =>
          lead.id === leadId
            ? { ...lead, notes: lead.notes.map((leadNote) => (leadNote.id === noteId ? savedNote : leadNote)) }
            : lead,
        );

        return withLeads(currentSnapshot, nextLeads);
      });
      setSelectedLead((currentLead) =>
        currentLead?.id === leadId
          ? { ...currentLead, notes: currentLead.notes.map((leadNote) => (leadNote.id === noteId ? savedNote : leadNote)) }
          : currentLead,
      );

      if (!options.skipToast) {
        showActionToast("success", "Nota actualizada.");
      }

      return true;
    } catch (noteError) {
      if (isSessionExpiredError(noteError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(noteError, "No pudimos actualizar la nota.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);

      if (!options.skipToast) {
        showActionToast("error", "No pudimos actualizar la nota.", message);
      }

      return false;
    }
  };

  const deleteLeadNote = async (leadId: string, noteId: number, options: ActionOptions = {}) => {
    setError("");
    const previousSnapshot = snapshot;
    const deletedNote =
      previousSnapshot?.leads.find((lead) => lead.id === leadId)?.notes.find((leadNote) => leadNote.id === noteId) ||
      selectedLead?.notes.find((leadNote) => leadNote.id === noteId) ||
      null;
    const removeNote = (notes: LeadNote[]) => notes.filter((leadNote) => leadNote.id !== noteId);

    setSnapshot((currentSnapshot) => {
      if (!currentSnapshot) {
        return currentSnapshot;
      }

      const nextLeads = currentSnapshot.leads.map((lead) =>
        lead.id === leadId ? { ...lead, notes: removeNote(lead.notes) } : lead,
      );

      return withLeads(currentSnapshot, nextLeads);
    });
    setSelectedLead((currentLead) =>
      currentLead?.id === leadId ? { ...currentLead, notes: removeNote(currentLead.notes) } : currentLead,
    );

    try {
      await apiRequest<{ id: number }>("/api/cirugia360-speed/dashboard?resource=lead-note", {
        method: "DELETE",
        body: JSON.stringify({ noteId }),
      });

      if (!options.skipToast && !options.skipUndoToast && deletedNote) {
        toast.success("Nota eliminada.", {
          description: "Puedes deshacer esta accion durante unos segundos.",
          duration: 6000,
          action: {
            label: "Deshacer",
            onClick: async () => {
              try {
                const restoredNote = await apiRequest<LeadNote>("/api/cirugia360-speed/dashboard?resource=lead-note", {
                  method: "PATCH",
                  body: JSON.stringify({
                    action: "restore",
                    noteId,
                  }),
                });
                const addRestoredNote = (notes: LeadNote[]) => {
                  if (notes.some((leadNote) => leadNote.id === restoredNote.id)) {
                    return notes;
                  }

                  return [restoredNote, ...notes].sort(
                    (firstNote, secondNote) => Date.parse(secondNote.createdAt) - Date.parse(firstNote.createdAt),
                  );
                };

                setSnapshot((currentSnapshot) => {
                  if (!currentSnapshot) {
                    return currentSnapshot;
                  }

                  const nextLeads = currentSnapshot.leads.map((lead) =>
                    lead.id === leadId ? { ...lead, notes: addRestoredNote(lead.notes) } : lead,
                  );

                  return withLeads(currentSnapshot, nextLeads);
                });
                setSelectedLead((currentLead) =>
                  currentLead?.id === leadId ? { ...currentLead, notes: addRestoredNote(currentLead.notes) } : currentLead,
                );
                showActionToast("success", "Nota restaurada.");
              } catch (restoreError) {
                const message = getDashboardErrorMessage(restoreError, "No pudimos restaurar la nota.");
                showActionToast("error", "No pudimos restaurar la nota.", message);
              }
            },
          },
        });
      } else if (!options.skipToast) {
        showActionToast("success", "Nota eliminada.");
      }

      return true;
    } catch (noteError) {
      if (isSessionExpiredError(noteError)) {
        await expireDashboardSession();
        return false;
      }

      const message = getDashboardErrorMessage(noteError, "No pudimos eliminar la nota.");
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);

      if (!options.skipToast) {
        showActionToast("error", "No pudimos eliminar la nota.", message);
      }

      return false;
    }
  };

  if (!isAuthReady) {
    return (
      <main className="min-h-screen bg-dashboard-page text-dashboard-ink lg:pl-[220px]">
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[220px] lg:flex-col lg:border-r lg:border-dashboard-line-soft lg:bg-white">
          <div className="border-b border-dashboard-line-soft px-5 py-5">
            <p className="text-[15px] font-bold tracking-[-0.01em] text-dashboard-primary">Cirugia360</p>
            <div className="mt-2 h-2 w-24 rounded bg-slate-100" />
          </div>
        </aside>
        <header className="sticky top-0 z-30 border-b border-dashboard-line-soft bg-white/95">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <div className="min-w-0 flex-1">
              <div className="h-5 w-40 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
            </div>
            <RefreshCcw className="h-5 w-5 animate-spin text-dashboard-muted" />
          </div>
        </header>
        <div className="px-4 py-4 lg:px-6">
          <section className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="mt-5 h-8 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </section>
        </div>
      </main>
    );
  }

  if (!session) {
    return <LoginPanel onReady={setSession} banner={authBanner} />;
  }

  const leads = snapshot?.leads || [];
  const stages = snapshot?.pipelineStages || [];
  const viewerRole = snapshot?.viewer?.role || "admin";
  const visibleNavItems = roleVisibleNavItems(viewerRole);
  const activeNavItem = visibleNavItems.find((item) => item.id === activeView) || visibleNavItems[0];
  const currentUserEmail = session.user.email?.toLowerCase() || null;
  const currentAgent = settings?.agents.find(
    (agent) => agent.email?.toLowerCase() === currentUserEmail,
  );

  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr] bg-dashboard-page text-dashboard-ink lg:pl-[220px]">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[220px] lg:flex-col lg:border-r lg:border-dashboard-line-soft lg:bg-white">
        <div className="border-b border-dashboard-line-soft px-5 py-5">
          <p className="text-[15px] font-bold tracking-[-0.01em] text-dashboard-primary">Cirugia360</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-dashboard-subtle">
            Lead system
          </p>
        </div>
        <nav aria-label="Secciones del dashboard" className="flex-1 space-y-0.5 p-2.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                  active
                    ? "bg-dashboard-soft font-semibold text-dashboard-primary"
                    : "font-normal text-dashboard-muted hover:bg-dashboard-hover hover:text-dashboard-primary"
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-dashboard-line-soft px-5 py-4 text-[11px] text-dashboard-subtle">
          Dashboard comercial
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-dashboard-line-soft bg-white/95 backdrop-blur lg:bg-white">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-dashboard-subtle lg:hidden">Cirugia360</p>
            <h1 className="truncate text-lg font-bold tracking-[-0.01em] text-dashboard-ink">
              {activeNavItem?.label || "Dashboard comercial"}
            </h1>
            <p className="mt-0.5 truncate text-xs font-medium text-dashboard-subtle">
              {snapshot?.dateRange?.label || dashboardDateRange.label}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
            {viewerRole === "agent" && currentAgent ? (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${
                  currentAgent?.active !== false
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {currentAgent?.active !== false ? "Activa" : "Inactiva"}
              </span>
            ) : null}
            {viewerRole === "agent" && currentAgent ? (
              <button
                type="button"
                onClick={() => void toggleOwnAgentStatus()}
                disabled={isTogglingOwnStatus}
                className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  currentAgent.active === false ? "bg-emerald-700 hover:bg-emerald-800" : "bg-slate-700 hover:bg-slate-800"
                }`}
              >
                {isTogglingOwnStatus ? <RefreshCcw className="h-4 w-4 animate-spin" /> : null}
                {currentAgent.active === false ? "Activarme" : "Desactivarme"}
              </button>
            ) : null}
            {viewerRole === "agent" && currentAgent ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                Últimos 7 días: {formatHoursMinutes(currentAgent.activityAverageSeconds)}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setIsCreateLeadOpen(true)}
              className="inline-flex items-center gap-2 rounded-[10px] bg-dashboard-primary px-3 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Nuevo lead
            </button>
            <div className="flex rounded-[10px] border border-dashboard-line-soft bg-white p-1">
              {periodOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                    period === option.id
                      ? "bg-dashboard-soft text-dashboard-primary"
                      : "text-dashboard-muted hover:text-dashboard-primary"
                  }`}
                  onClick={() => setPeriod(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {period === "custom" ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="h-9 rounded-[10px] border border-dashboard-line-soft bg-white px-2 text-xs font-semibold text-dashboard-muted outline-none focus:border-dashboard-primary"
                  value={customRange.dateFrom}
                  onChange={(event) => setCustomRange((current) => ({ ...current, dateFrom: event.target.value }))}
                />
                <input
                  type="date"
                  className="h-9 rounded-[10px] border border-dashboard-line-soft bg-white px-2 text-xs font-semibold text-dashboard-muted outline-none focus:border-dashboard-primary"
                  value={customRange.dateTo}
                  onChange={(event) => setCustomRange((current) => ({ ...current, dateTo: event.target.value }))}
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-[10px] border border-dashboard-line-soft bg-white px-3 py-2 text-sm font-bold text-dashboard-muted transition hover:text-dashboard-primary"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-[10px] border border-dashboard-line-soft bg-white px-3 py-2 text-sm font-bold text-dashboard-muted transition hover:text-dashboard-primary"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
        <nav
          aria-label="Secciones del dashboard"
          className="flex gap-1 overflow-x-auto border-t border-dashboard-line-soft bg-white px-4 py-2 lg:hidden"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                  active ? "bg-dashboard-soft text-dashboard-primary" : "text-dashboard-muted hover:bg-dashboard-hover"
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className={activeView === "pipeline" ? "flex min-h-0 min-w-0" : "min-h-0 px-4 py-4 lg:px-6"}>
        <section className={activeView === "pipeline" ? "flex min-h-0 min-w-0 flex-1" : "mx-auto max-w-7xl min-w-0 space-y-4"}>
          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          {activeView === "overview" && snapshot ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {snapshot.speedMetrics.map((metric) => (
                  <MetricTile key={metric.id} metric={metric} />
                ))}
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-teal-700" />
                    <h2 className="font-semibold">Embudo</h2>
                  </div>
                  <div className="space-y-3">
                    {snapshot.funnelMetrics.map((metric) => (
                      <div key={metric.id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{metric.label}</span>
                          <span>{metric.count} - {formatCurrency(metric.value)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-700"
                            style={{
                              width: `${Math.min(100, (metric.count / Math.max(leads.length, 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-teal-700" />
                      <h2 className="font-semibold">Cola en vivo</h2>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                      {snapshot.queue?.length || 0} esperando
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(snapshot.queue || []).slice(0, 8).map((queuedLead) => (
                      <button
                        key={queuedLead.id}
                        type="button"
                        className="w-full rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-dashboard-primary hover:bg-white"
                        onClick={() => {
                          const lead = leads.find((currentLead) => currentLead.id === queuedLead.id);

                          if (lead) {
                            openLeadDetail(lead);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-slate-900">{queuedLead.fullName}</p>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">
                            {formatElapsed(queuedLead.waitingSince)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-600">
                          Esperando a {queuedLead.assignedAgentName || "vendedora disponible"}
                        </p>
                      </button>
                    ))}
                  </div>
                  {snapshot.queue?.length ? null : (
                    <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      No hay leads esperando.
                    </p>
                  )}
                </section>
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-teal-700" />
                    <h2 className="font-semibold">Llamadas</h2>
                  </div>
                  <div className="space-y-3">
                    {snapshot.callMetrics.map((metric) => (
                      <div key={metric.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                        <span className="text-sm text-slate-600">{metric.label}</span>
                        <strong>{metric.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : null}
          {activeView === "attribution" && snapshot ? (
            <AttributionView leads={leads} onSelect={openLeadDetail} />
          ) : null}

          {activeView === "pipeline" && snapshot ? (
            <PipelineBoard
              leads={leads}
              stages={stages}
              onSelect={openLeadDetail}
              onStage={updateStage}
              onCall={callLead}
              onOutcome={updateOutcome}
              onNewLead={() => setIsCreateLeadOpen(true)}
              currentUserEmail={currentUserEmail}
              updatingLeadId={updatingPipelineLeadId}
              callingLeadId={callingLeadId}
            />
          ) : null}

          {activeView === "leads" && snapshot ? (
            <LeadsTable
              leads={leads}
              onSelect={openLeadDetail}
              onCall={callLead}
              onNewLead={() => setIsCreateLeadOpen(true)}
              currentUserEmail={currentUserEmail}
              callingLeadId={callingLeadId}
            />
          ) : null}

          {activeView === "team" ? (
            <TeamSettings
              settings={settings}
              agentPerformance={snapshot?.agentPerformance || []}
              agentStatuses={snapshot?.agentStatuses || []}
              onRefresh={refresh}
              onSessionExpired={expireDashboardSession}
              onDirtyChange={handleTeamDirtyChange}
            />
          ) : null}

          {!snapshot && !error ? (
            <div className="grid min-h-96 place-items-center rounded-lg border border-slate-200 bg-white">
              <RefreshCcw className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : null}
        </section>
      </div>

      {selectedLead ? (
        <LeadDetail
          key={selectedLead.id}
          lead={selectedLead}
          stages={stages}
          settings={settings}
          onClose={closeLeadDetail}
          onStage={updateStage}
          onValue={updatePipelineValue}
          onOutcome={updateOutcome}
          onNote={addLeadNote}
          onUpdateNote={updateLeadNote}
          onDeleteNote={deleteLeadNote}
          onAgent={updateAssignedAgent}
          onCallback={updateCallback}
          onCall={callLead}
        />
      ) : null}
      {isCreateLeadOpen ? (
        <CreateLeadModal
          settings={settings}
          onClose={() => setIsCreateLeadOpen(false)}
          onCreate={createLead}
        />
      ) : null}
    </main>
  );
};

const Cirugia360DashboardWithBoundary = () => (
  <DashboardErrorBoundary>
    <Cirugia360Dashboard />
  </DashboardErrorBoundary>
);

export default Cirugia360DashboardWithBoundary;

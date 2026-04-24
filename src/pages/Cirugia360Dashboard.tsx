import {
  Activity,
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
  GripVertical,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  MessageCircle,
  Pause,
  Phone,
  Play,
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
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
  getDashboardAccessToken,
  getDashboardSupabase,
  getDashboardSupabaseConfigError,
  subscribeDashboardSession,
} from "@/lib/dashboardSupabase";

type DashboardMetric = {
  id: string;
  label: string;
  value: number | null;
  format?: "currency" | "duration";
  tone?: string;
};

type PipelineStage = {
  id: string;
  label: string;
};

type LeadNote = {
  id: number;
  createdAt: string;
  authorEmail: string | null;
  body: string;
};

type DashboardLead = {
  id: string;
  createdAt: string;
  status: string;
  salesCallStatus: string | null;
  customerCallStatus: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  procedureInterest: string | null;
  message: string | null;
  sourceUrl: string | null;
  assignedAgentName: string | null;
  agentAttempts: number;
  dispatchScheduledAt: string | null;
  customerConnectedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
  pipelineStage: string;
  pipelineOutcome: string;
  pipelineOutcomeReason: string | null;
  pipelineValue: number;
  recordingUrl: string | null;
  transcriptionText: string | null;
  notes: LeadNote[];
};

type AgentSettings = {
  businessTimeZone: string;
  queuePaused: boolean;
  agents: Array<{
    id: string;
    name: string;
    phone: string;
    active?: boolean;
  }>;
};

type DashboardSnapshot = {
  dateRange?: {
    dateFrom: string | null;
    dateTo: string | null;
    label: string;
  };
  generatedAt: string;
  pipelineStages: PipelineStage[];
  speedMetrics: DashboardMetric[];
  funnelMetrics: Array<{ id: string; label: string; count: number; value: number }>;
  callMetrics: Array<{ id: string; label: string; value: number }>;
  leads: DashboardLead[];
};

type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
};

type LeadCallResult = {
  leadId: string;
  callStarted?: boolean;
  queued?: boolean;
  dispatchScheduledAt?: string | null;
  assignedAgent?: string | null;
  warning?: string;
};

type ToastTone = "success" | "warning" | "error";

type ActionOptions = {
  skipToast?: boolean;
  skipUndoToast?: boolean;
};

type LeadSortKey = "createdAt" | "fullName" | "procedureInterest" | "assignedAgentName" | "status";

type SortDirection = "asc" | "desc";

type DashboardPeriod = "today" | "7d" | "30d" | "month" | "custom";

const navItems = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "pipeline", label: "Pipeline", icon: Target },
  { id: "leads", label: "Leads", icon: Users },
  { id: "team", label: "Equipo", icon: Settings },
];

const periodOptions: Array<{ id: DashboardPeriod; label: string }> = [
  { id: "today", label: "Hoy" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "month", label: "Mes" },
  { id: "custom", label: "Custom" },
];

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

const formatCurrency = (value: number | null) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Sin dato";

const formatMetric = (metric: DashboardMetric) => {
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

const apiRequest = async <T,>(path: string, options: RequestInit = {}) => {
  const token = await getDashboardAccessToken();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });
  const payload = (await response.json().catch(() => null)) as ApiResult<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "No pudimos completar la accion.");
  }

  return (payload.data ?? payload) as T;
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

const LoginPanel = ({ onReady }: { onReady: (session: Session) => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const configError = getDashboardSupabaseConfigError();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = getDashboardSupabase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.session) {
        throw signInError || new Error("No pudimos iniciar sesion.");
      }

      onReady(data.session);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "No pudimos iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7f8] px-4 py-12 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-md place-items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Cirugia360
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Dashboard comercial</h1>
          </div>

          {configError ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {configError}
            </div>
          ) : null}

          <label className="mb-3 block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="mb-4 block text-sm font-medium">
            Password
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={Boolean(configError) || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />}
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
};

const MetricTile = ({ metric }: { metric: DashboardMetric }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-sm text-slate-500">{metric.label}</p>
    <div className="mt-3 flex items-end justify-between gap-3">
      <strong className="text-2xl font-semibold text-slate-950">{formatMetric(metric)}</strong>
      <Activity className="h-5 w-5 text-teal-700" />
    </div>
  </article>
);

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
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
  connecting_customer: {
    label: "Conectando",
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
  callback_requested: {
    label: "Rellamada solicitada",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  customer_unreachable: {
    label: "No contestó",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  missed: {
    label: "No contestó",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  dispatch_failed: {
    label: "Error de llamada",
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

const humanizeStatus = (status: string) =>
  status
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Sin estado";

const getLeadStatus = (lead: DashboardLead) => {
  const statusKey =
    lead.customerConnectedAt && ["received", "scheduled", "dispatching", "connecting_customer"].includes(lead.status)
      ? "customer_connected"
      : lead.status;

  return STATUS_LABELS[statusKey] || {
    label: lead.lastError ? "Atención" : humanizeStatus(statusKey),
    className: lead.lastError ? STATUS_LABELS.failed.className : FALLBACK_STATUS_CLASSNAME,
  };
};

const leadMatchesSearch = (lead: DashboardLead, search: string) => {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    lead.fullName,
    lead.phone,
    lead.email,
    lead.procedureInterest,
    lead.assignedAgentName,
    lead.pipelineOutcomeReason,
    getLeadStatus(lead).label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
};

const LeadStatusBadge = ({ lead }: { lead: DashboardLead }) => {
  const status = getLeadStatus(lead);

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${status.className}`}>
      {status.label}
    </span>
  );
};

const stageVisuals: Record<
  string,
  {
    icon: typeof User;
    color: string;
    soft: string;
  }
> = {
  nuevo: { icon: User, color: "#13344F", soft: "#edf3f7" },
  contactado: { icon: Phone, color: "#3a9bb5", soft: "#e8f4f8" },
  contacto_whatsapp: { icon: MessageCircle, color: "#18a957", soft: "#e9fbf1" },
  esperando_pago: { icon: CreditCard, color: "#d98a06", soft: "#fff7e6" },
  eval_presencial: { icon: Stethoscope, color: "#7c3aed", soft: "#f0e7ff" },
  eval_online: { icon: Video, color: "#2563eb", soft: "#eaf0ff" },
  presupuesto: { icon: FileText, color: "#0891b2", soft: "#e6f7fb" },
  examenes: { icon: FlaskConical, color: "#c026d3", soft: "#fbe8ff" },
  cirugia: { icon: CalendarCheck, color: "#22a06b", soft: "#e6f9f0" },
};

const formatCompactMoney = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "$0.0M";
  }

  return `$${(value / 1000000).toFixed(1)}M`;
};

const PipelineBoard = ({
  leads,
  stages,
  onSelect,
  onStage,
  onCall,
  onOutcome,
  updatingLeadId,
  callingLeadId,
}: {
  leads: DashboardLead[];
  stages: PipelineStage[];
  onSelect: (lead: DashboardLead) => void;
  onStage: (leadId: string, stage: string, options?: ActionOptions) => Promise<boolean>;
  onCall: (leadId: string, options?: ActionOptions) => Promise<boolean>;
  onOutcome: (leadId: string, outcome: "active" | "lost" | "won", reason?: string, options?: ActionOptions) => Promise<boolean>;
  updatingLeadId: string | null;
  callingLeadId: string | null;
}) => {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "lost" | "won">("active");
  const [winLead, setWinLead] = useState<DashboardLead | null>(null);
  const [lossLead, setLossLead] = useState<DashboardLead | null>(null);
  const [lossReason, setLossReason] = useState("");
  const [lossError, setLossError] = useState("");

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const outcome = lead.pipelineOutcome || "active";
      const matchesView = view === "active" ? outcome !== "lost" && outcome !== "won" : outcome === view;

      if (!matchesView) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return leadMatchesSearch(lead, normalizedSearch);
    });
  }, [leads, search, view]);

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

    if (!lossReason.trim()) {
      setLossError("Ingresa el motivo de perdida.");
      return;
    }

    const saved = await onOutcome(lossLead.id, "lost", lossReason.trim());

    if (saved) {
      setLossLead(null);
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
            className={`group rounded-lg border bg-white p-3 shadow-sm transition ${
              isUpdating ? "cursor-wait opacity-60" : "cursor-grab active:cursor-grabbing"
            } ${dragId === lead.id ? "opacity-40" : "hover:-translate-y-0.5 hover:shadow-md"}`}
            style={{ borderColor: "#e4e8ec", borderTopColor: visual.color, borderTopWidth: 3 }}
          >
            <div className="flex items-start justify-between gap-3">
              <button className="min-w-0 flex-1 text-left" type="button" onClick={() => onSelect(lead)}>
                <h3 className="truncate text-[14px] font-bold text-[#1a2332]">{lead.fullName}</h3>
                <p className="mt-1 truncate text-xs font-medium text-[#5f6d7e]">
                  {lead.procedureInterest || "Evaluacion"}
                </p>
              </button>
              <div className="flex shrink-0 items-start gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-md p-1 text-[#5f6d7e] opacity-0 outline-none transition hover:bg-[#edf3f7] hover:text-[#13344F] focus:opacity-100 focus-visible:ring-2 focus-visible:ring-[#13344F] group-hover:opacity-100"
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
                <GripVertical className="mt-0.5 h-4 w-4 text-[#a7b0bc] transition group-hover:text-[#5f6d7e]" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <strong className="text-lg font-bold tracking-[-0.01em] text-[#1a2332]">
                {formatCompactMoney(lead.pipelineValue)}
              </strong>
              <LeadStatusBadge lead={lead} />
            </div>

            <div className="mt-3 grid gap-1.5 text-[11px] text-[#8e99a8]">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{lead.assignedAgentName || "Sin asesora"}</span>
                <span className="shrink-0">{formatDate(lead.createdAt)}</span>
              </div>
              <span className="truncate">{lead.phone}</span>
            </div>

            <label
              className="mt-3 block text-[11px] font-bold uppercase tracking-wide text-[#8e99a8] md:hidden"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
            >
              Etapa
              <select
                className="mt-1 h-9 w-full rounded-md border border-[#d9e0e5] bg-white px-2 text-xs font-semibold normal-case tracking-normal text-[#1a2332] outline-none focus:border-[#13344F]"
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
    <section className="flex h-[calc(100dvh-74px)] min-h-[640px] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#e8ecf0] bg-[#f6f8fa] px-4 py-3 lg:px-6">
        <div className="flex min-w-[260px] flex-1 flex-wrap items-center gap-2">
          {viewButtons.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                view === item.id
                  ? "border-[#13344F] bg-[#edf3f7] text-[#13344F]"
                  : "border-[#e4e8ec] bg-white text-[#5f6d7e] hover:border-[#cdd6df]"
              }`}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wide">{item.label}</span>
              <span className="mt-0.5 block text-sm font-bold">{item.value}</span>
            </button>
          ))}
        </div>
        <label className="relative w-full sm:w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e99a8]" />
          <input
            className="h-10 w-full rounded-lg border border-[#e4e8ec] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#13344F]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar paciente, telefono o asesora"
          />
        </label>
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
                  isOver ? "border-[#13344F] bg-[#edf3f7]" : "border-[#e4e8ec] bg-[#f9fafb]"
                }`}
              >
                <header className="mb-3 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                        style={{ background: visual.soft, color: visual.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-[#1a2332]">{stage.label}</h2>
                        <p className="text-xs font-semibold text-[#8e99a8]">{formatCompactMoney(total)}</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-[#5f6d7e]">
                      {stageLeads.length}
                    </span>
                  </div>
                </header>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {stageLeads.map((lead) => renderLeadCard(lead, stage))}
                  {stageLeads.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#d9e0e5] bg-white/70 p-4 text-sm font-medium text-[#8e99a8]">
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
                className="rounded-lg border border-[#e4e8ec] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#1a2332]">{lead.fullName}</h3>
                    <p className="mt-1 truncate text-xs text-[#5f6d7e]">
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
                <strong className="mt-3 block text-xl font-bold text-[#1a2332]">
                  {formatCurrency(lead.pipelineValue)}
                </strong>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8e99a8]">
                  <span>{lead.assignedAgentName || "Sin asesora"}</span>
                  <span>{formatDate(lead.createdAt)}</span>
                </div>
                {view === "lost" && lead.pipelineOutcomeReason ? (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#5f6d7e]">
                    {lead.pipelineOutcomeReason}
                  </p>
                ) : null}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onOutcome(lead.id, "active");
                    }}
                    className="rounded-md border border-[#e4e8ec] px-3 py-1.5 text-xs font-bold text-[#13344F]"
                  >
                    Reabrir
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredLeads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d9e0e5] bg-white p-6 text-sm font-medium text-[#8e99a8]">
              No hay oportunidades para esta vista.
            </div>
          ) : null}
        </div>
      )}

      {winLead ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={() => setWinLead(null)}>
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e4e8ec] px-5 py-4">
              <h2 className="text-base font-bold text-[#1a2332]">Marcar como ganada</h2>
              <button type="button" className="rounded-md p-1.5 hover:bg-slate-100" onClick={() => setWinLead(null)}>
                <XCircle className="h-5 w-5 text-[#5f6d7e]" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-sm leading-6 text-[#5f6d7e]">
                {winLead.fullName} saldra del pipeline activo y quedara registrada en Ganadas.
              </p>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                Valor comercial: {formatCurrency(winLead.pipelineValue)}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e4e8ec] px-5 py-4">
              <button
                type="button"
                className="rounded-md border border-[#e4e8ec] px-3 py-2 text-sm font-bold text-[#5f6d7e]"
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
            <div className="flex items-center justify-between border-b border-[#e4e8ec] px-5 py-4">
              <h2 className="text-base font-bold text-[#1a2332]">Marcar como perdida</h2>
              <button type="button" className="rounded-md p-1.5 hover:bg-slate-100" onClick={() => setLossLead(null)}>
                <XCircle className="h-5 w-5 text-[#5f6d7e]" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-sm leading-6 text-[#5f6d7e]">
                {lossLead.fullName} saldra del pipeline activo y quedara registrada en Perdidas.
              </p>
              <textarea
                className="min-h-28 w-full rounded-lg border border-[#e4e8ec] px-3 py-2 text-sm outline-none focus:border-[#13344F]"
                value={lossReason}
                onChange={(event) => {
                  setLossReason(event.target.value);
                  setLossError("");
                }}
                placeholder="Motivo de perdida"
              />
              {lossError ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{lossError}</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e4e8ec] px-5 py-4">
              <button
                type="button"
                className="rounded-md border border-[#e4e8ec] px-3 py-2 text-sm font-bold text-[#5f6d7e]"
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
  callingLeadId,
}: {
  leads: DashboardLead[];
  onSelect: (lead: DashboardLead) => void;
  onCall: (leadId: string, options?: ActionOptions) => Promise<boolean>;
  callingLeadId: string | null;
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
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
  }, [agentFilter, leads, search, sortDirection, sortKey, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const shouldPaginate = filteredLeads.length > LEADS_PAGE_SIZE;
  const visibleLeads = shouldPaginate
    ? filteredLeads.slice((currentPage - 1) * LEADS_PAGE_SIZE, currentPage * LEADS_PAGE_SIZE)
    : filteredLeads;

  useEffect(() => {
    setPage(1);
  }, [agentFilter, search, statusFilter]);

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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e99a8]" />
          <input
            className="h-10 w-full rounded-lg border border-[#e4e8ec] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#13344F]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar paciente, telefono, procedimiento o asesora"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:w-[420px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado
            <select
              className="mt-1 h-10 w-full rounded-lg border border-[#e4e8ec] bg-white px-3 text-sm font-normal normal-case text-slate-900 outline-none focus:border-[#13344F]"
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
              className="mt-1 h-10 w-full rounded-lg border border-[#e4e8ec] bg-white px-3 text-sm font-normal normal-case text-slate-900 outline-none focus:border-[#13344F]"
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

const LeadCard = ({
  lead,
  stages,
  onSelect,
  onStage,
  onCall,
}: {
  lead: DashboardLead;
  stages: PipelineStage[];
  onSelect: (lead: DashboardLead) => void;
  onStage: (leadId: string, stage: string) => void;
  onCall: (leadId: string) => void;
}) => (
  <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <button className="min-w-0 text-left" type="button" onClick={() => onSelect(lead)}>
        <h3 className="truncate text-sm font-semibold text-slate-950">{lead.fullName}</h3>
        <p className="mt-1 truncate text-xs text-slate-500">{lead.procedureInterest || "Evaluacion"}</p>
      </button>
      <LeadStatusBadge lead={lead} />
    </div>
    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
      <span>{formatDate(lead.createdAt)}</span>
      <span>{lead.assignedAgentName || "Sin asesora"}</span>
    </div>
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={() => onCall(lead.id)}
        className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1.5 text-xs font-semibold text-teal-800"
      >
        <Phone className="h-3.5 w-3.5" />
        Llamar
      </button>
      <select
        value={lead.pipelineStage}
        onChange={(event) => onStage(lead.id, event.target.value)}
        className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
      >
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.label}
          </option>
        ))}
      </select>
    </div>
  </article>
);

const LeadDetail = ({
  lead,
  stages,
  onClose,
  onStage,
  onValue,
  onOutcome,
  onNote,
  onCall,
}: {
  lead: DashboardLead;
  stages: PipelineStage[];
  onClose: () => void;
  onStage: (leadId: string, stage: string, options?: ActionOptions) => Promise<boolean>;
  onValue: (leadId: string, pipelineValue: number, options?: ActionOptions) => Promise<boolean>;
  onOutcome: (leadId: string, outcome: "active" | "lost" | "won", reason?: string, options?: ActionOptions) => Promise<boolean>;
  onNote: (leadId: string, body: string, options?: ActionOptions) => Promise<boolean>;
  onCall: (leadId: string, options?: ActionOptions) => Promise<boolean>;
}) => {
  const [note, setNote] = useState("");
  const [value, setValue] = useState(String(Math.round(lead.pipelineValue || 0)));
  const [reason, setReason] = useState(lead.pipelineOutcomeReason || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [drawerToast, setDrawerToast] = useState<{ id: number; tone: ToastTone; title: string; detail?: string } | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

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
    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  const saveOutcome = async (outcome: "active" | "lost" | "won") => {
    setIsSaving(true);
    setError("");

    try {
      const saved = await onOutcome(lead.id, outcome, reason, { skipToast: true, skipUndoToast: true });

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
      setIsSaving(false);
    }
  };

  const saveNote = async () => {
    if (!note.trim()) {
      return;
    }

    setIsSaving(true);
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
      setIsSaving(false);
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
          <Detail label="Asesora" value={lead.assignedAgentName || "Sin asignar"} />
          <Detail label="Intentos" value={String(lead.agentAttempts || 0)} />
          <Detail label="Ultimo error" value={lead.lastError || "Sin error"} />
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
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
                  onClick={saveValue}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            </label>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-sm" onClick={() => saveOutcome("active")}>
              Activo
            </button>
            <button type="button" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" onClick={() => saveOutcome("won")}>
              Ganado
            </button>
            <button type="button" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" onClick={() => saveOutcome("lost")}>
              Perdido
            </button>
          </div>
          <input
            className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="Motivo de perdida"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </section>

        {lead.recordingUrl || lead.transcriptionText ? (
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold">Grabacion y transcripcion</h3>
            {lead.recordingUrl ? (
              <a className="text-sm font-medium text-teal-700" href={lead.recordingUrl} target="_blank" rel="noreferrer">
                Abrir grabacion
              </a>
            ) : null}
            {lead.transcriptionText ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{lead.transcriptionText}</p>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold">Notas</h3>
          <textarea
            className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <button
            type="button"
            className="mt-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
            onClick={saveNote}
            disabled={isSaving}
          >
            Guardar nota
          </button>
          <div className="mt-4 space-y-3">
            {lead.notes.map((leadNote) => (
              <div key={leadNote.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="text-slate-800">{leadNote.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(leadNote.createdAt)} - {leadNote.authorEmail || "Dashboard"}
                </p>
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

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm text-slate-900">{value}</p>
  </div>
);

const TeamSettings = ({
  settings,
  onRefresh,
}: {
  settings: AgentSettings | null;
  onRefresh: () => void;
}) => {
  const [draft, setDraft] = useState<AgentSettings>(
    settings || {
      businessTimeZone: "America/Santiago",
      queuePaused: false,
      agents: [],
    },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (settings) {
      setDraft(settings);
    }
  }, [settings]);

  const updateAgent = (index: number, key: "name" | "phone" | "active", value: string | boolean) => {
    setDraft((current) => ({
      ...current,
      agents: current.agents.map((agent, agentIndex) =>
        agentIndex === index ? { ...agent, [key]: value } : agent,
      ),
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setError("");

    try {
      const data = await apiRequest<AgentSettings>("/api/cirugia360-speed/dashboard?resource=sales-agents", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setDraft(data);
      onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleQueue = async () => {
    setIsSaving(true);
    setError("");

    try {
      const data = await apiRequest<AgentSettings>("/api/cirugia360-speed/dashboard?resource=queue-control", {
        method: "POST",
        body: JSON.stringify({
          action: draft.queuePaused ? "resume" : "pause",
        }),
      });
      setDraft(data);
      onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos cambiar la cola.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Equipo y cola</h2>
          <p className="text-sm text-slate-500">{draft.businessTimeZone}</p>
        </div>
        <button
          type="button"
          onClick={toggleQueue}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold"
        >
          {draft.queuePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {draft.queuePaused ? "Reanudar cola" : "Pausar cola"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {draft.agents.map((agent, index) => (
          <div key={agent.id || index} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1fr_auto]">
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
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={agent.active !== false}
                onChange={(event) => updateAgent(index, "active", event.target.checked)}
              />
              Activa
            </label>
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
                  active: true,
                },
              ],
            }))
          }
        >
          Agregar asesora
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
          onClick={saveSettings}
          disabled={isSaving}
        >
          <Save className="h-4 w-4" />
          Guardar equipo
        </button>
      </div>

      {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingPipelineLeadId, setUpdatingPipelineLeadId] = useState<string | null>(null);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>("7d");
  const [customRange, setCustomRange] = useState({
    dateFrom: toDateInputValue(new Date()),
    dateTo: toDateInputValue(new Date()),
  });
  const leadDetailReturnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const configError = getDashboardSupabaseConfigError();

    if (configError) {
      setIsAuthReady(true);
      return;
    }

    const supabase = getDashboardSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthReady(true);
    });

    return subscribeDashboardSession((nextSession) => {
      setSession(nextSession);
    });
  }, []);

  const dashboardDateRange = useMemo(() => getDashboardDateRange(period, customRange), [customRange, period]);

  const refresh = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsLoading(true);
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
      const [dashboardData, settingsData] = await Promise.all([
        apiRequest<DashboardSnapshot>(dashboardPath),
        apiRequest<AgentSettings>("/api/cirugia360-speed/dashboard?resource=sales-agents"),
      ]);

      setSnapshot(dashboardData);
      setSettings(settingsData);
      setSelectedLead((currentLead) =>
        currentLead ? dashboardData.leads.find((lead) => lead.id === currentLead.id) || null : null,
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar el dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [dashboardDateRange.dateFrom, dashboardDateRange.dateTo, session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = async () => {
    await getDashboardSupabase().auth.signOut();
    setSnapshot(null);
    setSettings(null);
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
      const message = stageError instanceof Error ? stageError.message : "No pudimos actualizar la etapa.";
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
      const message = callError instanceof Error ? callError.message : "No pudimos iniciar la llamada.";
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
    const previousReason = previousLead?.pipelineOutcomeReason || "";
    patchLead(leadId, {
      pipelineOutcome: outcome,
      pipelineOutcomeReason: outcome === "lost" ? reason : null,
    });

    try {
      await apiRequest("/api/cirugia360-speed/pipeline-stage", {
        method: "POST",
        body: JSON.stringify({
          action: "outcome",
          leadId,
          outcome,
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
              void updateOutcome(leadId, previousOutcome, previousReason, { skipUndoToast: true });
            },
          },
        });
      }
      return true;
    } catch (outcomeError) {
      const message = outcomeError instanceof Error ? outcomeError.message : "No pudimos actualizar la oportunidad.";
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
      const message = valueError instanceof Error ? valueError.message : "No pudimos guardar el valor.";
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
      const message = noteError instanceof Error ? noteError.message : "No pudimos guardar la nota.";
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);
      if (!options.skipToast) {
        showActionToast("error", "No pudimos guardar la nota.", message);
      }
      return false;
    }
  };

  if (!isAuthReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7f8] text-slate-950">
        <RefreshCcw className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  if (!session) {
    return <LoginPanel onReady={setSession} />;
  }

  const leads = snapshot?.leads || [];
  const stages = snapshot?.pipelineStages || [];
  const activeNavItem = navItems.find((item) => item.id === activeView);

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1a2332] lg:pl-[220px]">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[220px] lg:flex-col lg:border-r lg:border-[#e8ecf0] lg:bg-white">
        <div className="border-b border-[#e8ecf0] px-5 py-5">
          <p className="text-[15px] font-bold tracking-[-0.01em] text-[#13344F]">Cirugia360</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[#8e99a8]">
            Lead system
          </p>
        </div>
        <nav aria-label="Secciones del dashboard" className="flex-1 space-y-0.5 p-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                  active
                    ? "bg-[#edf3f7] font-semibold text-[#13344F]"
                    : "font-normal text-[#5f6d7e] hover:bg-[#f5f7f9] hover:text-[#13344F]"
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[#e8ecf0] px-5 py-4 text-[11px] text-[#8e99a8]">
          Dashboard comercial
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-[#e8ecf0] bg-white/95 backdrop-blur lg:bg-white">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8e99a8] lg:hidden">Cirugia360</p>
            <h1 className="truncate text-lg font-bold tracking-[-0.01em] text-[#1a2332]">
              {activeNavItem?.label || "Dashboard comercial"}
            </h1>
            <p className="mt-0.5 truncate text-xs font-medium text-[#8e99a8]">
              {snapshot?.dateRange?.label || dashboardDateRange.label}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
            <div className="flex rounded-[10px] border border-[#e8ecf0] bg-white p-1">
              {periodOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                    period === option.id
                      ? "bg-[#edf3f7] text-[#13344F]"
                      : "text-[#5f6d7e] hover:text-[#13344F]"
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
                  className="h-9 rounded-[10px] border border-[#e8ecf0] bg-white px-2 text-xs font-semibold text-[#5f6d7e] outline-none focus:border-[#13344F]"
                  value={customRange.dateFrom}
                  onChange={(event) => setCustomRange((current) => ({ ...current, dateFrom: event.target.value }))}
                />
                <input
                  type="date"
                  className="h-9 rounded-[10px] border border-[#e8ecf0] bg-white px-2 text-xs font-semibold text-[#5f6d7e] outline-none focus:border-[#13344F]"
                  value={customRange.dateTo}
                  onChange={(event) => setCustomRange((current) => ({ ...current, dateTo: event.target.value }))}
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#e8ecf0] bg-white px-3 py-2 text-sm font-bold text-[#5f6d7e] transition hover:text-[#13344F]"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#e8ecf0] bg-white px-3 py-2 text-sm font-bold text-[#5f6d7e] transition hover:text-[#13344F]"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
        <nav
          aria-label="Secciones del dashboard"
          className="flex gap-1 overflow-x-auto border-t border-[#e8ecf0] bg-white px-4 py-2 lg:hidden"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                  active ? "bg-[#edf3f7] text-[#13344F]" : "text-[#5f6d7e] hover:bg-[#f5f7f9]"
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

      <div className={activeView === "pipeline" ? "min-w-0" : "px-4 py-4 lg:px-6"}>
        <section className={activeView === "pipeline" ? "min-w-0" : "mx-auto max-w-7xl min-w-0 space-y-4"}>
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
          {activeView === "pipeline" && snapshot ? (
            <PipelineBoard
              leads={leads}
              stages={stages}
              onSelect={openLeadDetail}
              onStage={updateStage}
              onCall={callLead}
              onOutcome={updateOutcome}
              updatingLeadId={updatingPipelineLeadId}
              callingLeadId={callingLeadId}
            />
          ) : null}

          {activeView === "leads" && snapshot ? (
            <LeadsTable
              leads={leads}
              onSelect={openLeadDetail}
              onCall={callLead}
              callingLeadId={callingLeadId}
            />
          ) : null}

          {activeView === "team" ? (
            <TeamSettings settings={settings} onRefresh={refresh} />
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
          onClose={closeLeadDetail}
          onStage={updateStage}
          onValue={updatePipelineValue}
          onOutcome={updateOutcome}
          onNote={addLeadNote}
          onCall={callLead}
        />
      ) : null}
    </main>
  );
};

export default Cirugia360Dashboard;

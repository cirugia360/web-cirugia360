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
  updatedAt?: string | null;
  authorEmail: string | null;
  editedByEmail?: string | null;
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
  assignedAgentEmail: string | null;
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
    email?: string | null;
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

class SessionExpiredError extends Error {
  constructor() {
    super("Tu sesión expiró, vuelve a iniciar.");
    this.name = "SessionExpiredError";
  }
}

type LeadCallResult = {
  leadId: string;
  callStarted?: boolean;
  queued?: boolean;
  dispatchScheduledAt?: string | null;
  assignedAgent?: string | null;
  warning?: string;
};

type CreateLeadPayload = {
  fullName: string;
  phone: string;
  procedureInterest: string;
  assignedAgentId: string;
  pipelineValue: number;
};

type ToastTone = "success" | "warning" | "error";

type ActionOptions = {
  skipToast?: boolean;
  skipUndoToast?: boolean;
};

type RefreshOptions = {
  silent?: boolean;
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

const businessTimeZoneOptions = [
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Lima",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
];

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

const apiRequest = async <T,>(path: string, options: RequestInit = {}, hasRetriedAuth = false): Promise<T> => {
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

  if (response.status === 401) {
    if (!hasRetriedAuth) {
      const { data, error } = await getDashboardSupabase().auth.refreshSession();

      if (!error && data.session) {
        return apiRequest<T>(path, options, true);
      }
    }

    throw new SessionExpiredError();
  }

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

const isSessionExpiredError = (error: unknown) => error instanceof SessionExpiredError;

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

const LoginPanel = ({ onReady, banner }: { onReady: (session: Session) => void; banner?: string }) => {
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
    <main className="min-h-screen bg-dashboard-page-muted px-4 py-12 text-slate-950">
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

          {banner ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
              {banner}
            </div>
          ) : null}

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
    lead.assignedAgentEmail,
    lead.pipelineOutcomeReason,
    getLeadStatus(lead).label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
};

const escapeCsvValue = (value: string | number | null | undefined) => {
  const rawValue = String(value ?? "");
  const escapedValue = rawValue.replace(/"/g, '""');

  return /[",\n\r]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
};

const exportLeadsCsv = (leads: DashboardLead[], filenamePrefix: string) => {
  const headers = [
    "ID",
    "Creado",
    "Paciente",
    "Telefono",
    "Email",
    "Procedimiento",
    "Asesora",
    "Estado",
    "Etapa",
    "Outcome",
    "Motivo outcome",
    "Valor pipeline",
    "Fuente",
    "Intentos",
    "Ultimo error",
  ];
  const rows = leads.map((lead) => [
    lead.id,
    lead.createdAt,
    lead.fullName,
    lead.phone,
    lead.email,
    lead.procedureInterest || "Evaluacion",
    lead.assignedAgentName || "Sin asignar",
    getLeadStatus(lead).label,
    lead.pipelineStage,
    lead.pipelineOutcome || "active",
    lead.pipelineOutcomeReason || "",
    lead.pipelineValue,
    lead.sourceUrl || "",
    lead.agentAttempts,
    lead.lastError || "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStamp = toDateInputValue(new Date());

  link.href = url;
  link.download = `${filenamePrefix}-${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
    <section className="flex h-[calc(100dvh-74px)] min-h-[640px] flex-col overflow-hidden">
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
                {view === "lost" && lead.pipelineOutcomeReason ? (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-dashboard-muted">
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
              <textarea
                className="min-h-28 w-full rounded-lg border border-dashboard-line px-3 py-2 text-sm outline-none focus:border-dashboard-primary"
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
  settings,
  onClose,
  onStage,
  onValue,
  onOutcome,
  onNote,
  onUpdateNote,
  onDeleteNote,
  onAgent,
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
  onCall: (leadId: string, options?: ActionOptions) => Promise<boolean>;
}) => {
  const [note, setNote] = useState("");
  const [value, setValue] = useState(String(Math.round(lead.pipelineValue || 0)));
  const [reason, setReason] = useState(lead.pipelineOutcomeReason || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [drawerToast, setDrawerToast] = useState<{ id: number; tone: ToastTone; title: string; detail?: string } | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const activeAgents = (settings?.agents || []).filter((agent) => agent.active !== false);
  const selectedAgentId =
    activeAgents.find(
      (agent) => agent.name === lead.assignedAgentName,
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

  const updateDrawerAgent = async (assignedAgentId: string) => {
    const saved = await onAgent(lead.id, assignedAgentId, { skipToast: true });

    if (saved) {
      showDrawerToast("success", "Asesora actualizada.");
    } else {
      showDrawerToast("error", "No pudimos actualizar la asesora.");
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

    setIsSaving(true);
    const saved = await onUpdateNote(lead.id, editingNoteId, editingNoteBody, { skipToast: true });
    setIsSaving(false);

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

    setIsSaving(true);
    const deleted = await onDeleteNote(lead.id, leadNote.id, { skipToast: true });
    setIsSaving(false);

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
              {activeAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>
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
                        className="rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white"
                        onClick={() => void saveEditedNote()}
                        disabled={isSaving}
                      >
                        Guardar
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
                      className="text-xs font-semibold text-red-700"
                      onClick={() => void deleteNote(leadNote)}
                    >
                      Eliminar
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

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm text-slate-900">{value}</p>
  </div>
);

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

const TeamSettings = ({
  settings,
  onRefresh,
  onSessionExpired,
}: {
  settings: AgentSettings | null;
  onRefresh: () => void;
  onSessionExpired: () => Promise<void>;
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

  const updateAgent = (index: number, key: "name" | "phone" | "email" | "active", value: string | boolean) => {
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

    return "";
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setError("");

    const validationError = validateTeamSettings();

    if (validationError) {
      setError(validationError);
      setIsSaving(false);
      return;
    }

    try {
      const data = await apiRequest<AgentSettings>("/api/cirugia360-speed/dashboard?resource=sales-agents", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setDraft(data);
      onRefresh();
    } catch (saveError) {
      if (isSessionExpiredError(saveError)) {
        await onSessionExpired();
        return;
      }

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
      if (isSessionExpiredError(saveError)) {
        await onSessionExpired();
        return;
      }

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
          <p className="text-sm text-slate-500">Asesoras, zona horaria y estado de la cola</p>
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
          <div key={agent.id || index} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
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
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={agent.active !== false}
                onChange={(event) => updateAgent(index, "active", event.target.checked)}
              />
              Activa
            </label>
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
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [error, setError] = useState("");
  const [authBanner, setAuthBanner] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingPipelineLeadId, setUpdatingPipelineLeadId] = useState<string | null>(null);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>("7d");
  const [customRange, setCustomRange] = useState({
    dateFrom: toDateInputValue(new Date()),
    dateTo: toDateInputValue(new Date()),
  });
  const leadDetailReturnFocusRef = useRef<HTMLElement | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const realtimeRefreshTimerRef = useRef<number | null>(null);

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
      if (nextSession) {
        setAuthBanner("");
      }
    });
  }, []);

  const expireDashboardSession = useCallback(async () => {
    setAuthBanner("Tu sesión expiró, vuelve a iniciar.");
    setError("");
    setSnapshot(null);
    setSettings(null);
    setSelectedLead(null);
    setSession(null);
    await getDashboardSupabase().auth.signOut();
  }, []);

  const dashboardDateRange = useMemo(() => getDashboardDateRange(period, customRange), [customRange, period]);

  const refresh = useCallback(async (options: RefreshOptions = {}) => {
    if (!session) {
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
      if (isSessionExpiredError(loadError)) {
        await expireDashboardSession();
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar el dashboard.");
    } finally {
      if (!options.silent) {
        setIsLoading(false);
      }
    }
  }, [dashboardDateRange.dateFrom, dashboardDateRange.dateTo, expireDashboardSession, session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!session) {
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
  }, [refresh, session]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const supabase = getDashboardSupabase();
    const channel = supabase
      .channel("c360-speed-leads-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
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
  }, [refresh, session]);

  const signOut = async () => {
    await getDashboardSupabase().auth.signOut();
    setAuthBanner("");
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
      if (isSessionExpiredError(stageError)) {
        await expireDashboardSession();
        return false;
      }

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
      if (isSessionExpiredError(callError)) {
        await expireDashboardSession();
        return false;
      }

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

      const message = createError instanceof Error ? createError.message : "No se pudo crear el lead.";
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
      if (isSessionExpiredError(outcomeError)) {
        await expireDashboardSession();
        return false;
      }

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
      if (isSessionExpiredError(valueError)) {
        await expireDashboardSession();
        return false;
      }

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

      const message = agentError instanceof Error ? agentError.message : "No pudimos actualizar la asesora.";
      setError(message);
      await reconcileAfterFailure(previousSnapshot);
      setError(message);

      if (!options.skipToast) {
        showActionToast("error", "No pudimos actualizar la asesora.", message);
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

      const message = noteError instanceof Error ? noteError.message : "No pudimos actualizar la nota.";
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

      if (!options.skipToast) {
        showActionToast("success", "Nota eliminada.");
      }

      return true;
    } catch (noteError) {
      if (isSessionExpiredError(noteError)) {
        await expireDashboardSession();
        return false;
      }

      const message = noteError instanceof Error ? noteError.message : "No pudimos eliminar la nota.";
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
      <main className="grid min-h-screen place-items-center bg-dashboard-page-muted text-slate-950">
        <RefreshCcw className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  if (!session) {
    return <LoginPanel onReady={setSession} banner={authBanner} />;
  }

  const leads = snapshot?.leads || [];
  const stages = snapshot?.pipelineStages || [];
  const activeNavItem = navItems.find((item) => item.id === activeView);
  const currentUserEmail = session.user.email?.toLowerCase() || null;

  return (
    <main className="min-h-screen bg-dashboard-page text-dashboard-ink lg:pl-[220px]">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[220px] lg:flex-col lg:border-r lg:border-dashboard-line-soft lg:bg-white">
        <div className="border-b border-dashboard-line-soft px-5 py-5">
          <p className="text-[15px] font-bold tracking-[-0.01em] text-dashboard-primary">Cirugia360</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-dashboard-subtle">
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
              onClick={refresh}
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
          {navItems.map((item) => {
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
            <TeamSettings settings={settings} onRefresh={refresh} onSessionExpired={expireDashboardSession} />
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

export default Cirugia360Dashboard;


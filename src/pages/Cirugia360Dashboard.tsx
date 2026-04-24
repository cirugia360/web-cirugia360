import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarCheck,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  GripVertical,
  LayoutDashboard,
  LogOut,
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
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
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
};

const navItems = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "pipeline", label: "Pipeline", icon: Target },
  { id: "leads", label: "Leads", icon: Users },
  { id: "team", label: "Equipo", icon: Settings },
];

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

  return payload.data as T;
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

const LeadStatusBadge = ({ lead }: { lead: DashboardLead }) => {
  const connected = Boolean(lead.customerConnectedAt);
  const failed = Boolean(lead.lastError);
  const queued = ["scheduled", "dispatching"].includes(lead.status);
  const label = connected ? "Contactado" : failed ? "Atencion" : queued ? "En cola" : lead.status;
  const className = connected
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : failed
      ? "border-red-200 bg-red-50 text-red-700"
      : queued
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${className}`}>
      {label}
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
  onStage: (leadId: string, stage: string) => Promise<void>;
  onCall: (leadId: string) => Promise<void>;
  onOutcome: (leadId: string, outcome: "active" | "lost" | "won", reason?: string) => Promise<boolean>;
  updatingLeadId: string | null;
  callingLeadId: string | null;
}) => {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "lost" | "won">("active");
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

      return [
        lead.fullName,
        lead.phone,
        lead.email,
        lead.procedureInterest,
        lead.assignedAgentName,
        lead.pipelineOutcomeReason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
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

    return (
      <article
        key={lead.id}
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
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#a7b0bc] transition group-hover:text-[#5f6d7e]" />
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

        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
          <button
            type="button"
            onClick={() => void onCall(lead.id)}
            disabled={Boolean(callingLeadId) || isUpdating}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-md border border-[#cdebef] bg-[#edf8f9] px-2 py-1.5 text-xs font-bold text-[#137181] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Phone className={`h-3.5 w-3.5 ${isCalling ? "animate-pulse" : ""}`} />
            <span className="truncate">{isCalling ? "Llamando" : "Llamar"}</span>
          </button>
          <button
            type="button"
            onClick={() => void onOutcome(lead.id, "won")}
            disabled={isUpdating}
            className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-bold text-emerald-700 disabled:opacity-60"
          >
            Ganar
          </button>
          <button
            type="button"
            onClick={() => {
              setLossLead(lead);
              setLossReason("");
              setLossError("");
            }}
            disabled={isUpdating}
            className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-bold text-red-700 disabled:opacity-60"
          >
            Perder
          </button>
        </div>
      </article>
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
                className={`flex h-full w-[300px] shrink-0 flex-col rounded-lg border p-3 transition ${
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
              <button
                key={lead.id}
                type="button"
                onClick={() => onSelect(lead)}
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
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      void onOutcome(lead.id, "active");
                    }}
                    className="rounded-md border border-[#e4e8ec] px-3 py-1.5 text-xs font-bold text-[#13344F]"
                  >
                    Reabrir
                  </span>
                </div>
              </button>
            ))}
          </div>
          {filteredLeads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d9e0e5] bg-white p-6 text-sm font-medium text-[#8e99a8]">
              No hay oportunidades para esta vista.
            </div>
          ) : null}
        </div>
      )}

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
  onRefresh,
  onStage,
  onCall,
}: {
  lead: DashboardLead;
  stages: PipelineStage[];
  onClose: () => void;
  onRefresh: () => void;
  onStage: (leadId: string, stage: string) => void;
  onCall: (leadId: string) => void;
}) => {
  const [note, setNote] = useState("");
  const [value, setValue] = useState(String(Math.round(lead.pipelineValue || 0)));
  const [reason, setReason] = useState(lead.pipelineOutcomeReason || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const saveValue = async () => {
    setIsSaving(true);
    setError("");

    try {
      await apiRequest("/api/cirugia360-speed/pipeline-stage", {
        method: "POST",
        body: JSON.stringify({
          action: "value",
          leadId: lead.id,
          pipelineValue: Number(value || 0),
        }),
      });
      onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveOutcome = async (outcome: "active" | "lost" | "won") => {
    setIsSaving(true);
    setError("");

    try {
      await apiRequest("/api/cirugia360-speed/pipeline-stage", {
        method: "POST",
        body: JSON.stringify({
          action: "outcome",
          leadId: lead.id,
          outcome,
          reason: outcome === "lost" ? reason : null,
        }),
      });
      onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar.");
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
      await apiRequest("/api/cirugia360-speed/dashboard?resource=lead-note", {
        method: "POST",
        body: JSON.stringify({
          leadId: lead.id,
          body: note,
        }),
      });
      setNote("");
      onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar la nota.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">{lead.fullName}</h2>
          <p className="text-sm text-slate-500">{lead.phone}</p>
        </div>
        <button type="button" className="rounded-md p-2 hover:bg-slate-100" onClick={onClose}>
          <XCircle className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCall(lead.id)}
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
                onChange={(event) => onStage(lead.id, event.target.value)}
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

  const refresh = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [dashboardData, settingsData] = await Promise.all([
        apiRequest<DashboardSnapshot>("/api/cirugia360-speed/dashboard"),
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
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = async () => {
    await getDashboardSupabase().auth.signOut();
    setSnapshot(null);
    setSettings(null);
  };

  const updateStage = async (leadId: string, stage: string) => {
    setError("");
    setUpdatingPipelineLeadId(leadId);

    try {
      await apiRequest("/api/cirugia360-speed/pipeline-stage", {
        method: "POST",
        body: JSON.stringify({
          action: "stage",
          leadId,
          stage,
        }),
      });
      await refresh();
    } catch (stageError) {
      setError(stageError instanceof Error ? stageError.message : "No pudimos actualizar la etapa.");
    } finally {
      setUpdatingPipelineLeadId(null);
    }
  };

  const callLead = async (leadId: string) => {
    setError("");
    setCallingLeadId(leadId);

    try {
      await apiRequest("/api/cirugia360-speed/dashboard?resource=lead-call", {
        method: "POST",
        body: JSON.stringify({ leadId }),
      });
      await refresh();
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : "No pudimos iniciar la llamada.");
    } finally {
      setCallingLeadId(null);
    }
  };

  const updateOutcome = async (leadId: string, outcome: "active" | "lost" | "won", reason = "") => {
    setError("");
    setUpdatingPipelineLeadId(leadId);

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
      await refresh();
      return true;
    } catch (outcomeError) {
      setError(outcomeError instanceof Error ? outcomeError.message : "No pudimos actualizar la oportunidad.");
      return false;
    } finally {
      setUpdatingPipelineLeadId(null);
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
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
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
              onSelect={setSelectedLead}
              onStage={updateStage}
              onCall={callLead}
              onOutcome={updateOutcome}
              updatingLeadId={updatingPipelineLeadId}
              callingLeadId={callingLeadId}
            />
          ) : null}

          {activeView === "leads" && snapshot ? (
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[1.2fr_.8fr_.8fr_.7fr_auto] gap-3 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Paciente</span>
                <span>Procedimiento</span>
                <span>Asesora</span>
                <span>Estado</span>
                <span />
              </div>
              <div className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <div key={lead.id} className="grid grid-cols-[1.2fr_.8fr_.8fr_.7fr_auto] gap-3 px-4 py-3 text-sm">
                    <button type="button" className="min-w-0 text-left" onClick={() => setSelectedLead(lead)}>
                      <strong className="block truncate">{lead.fullName}</strong>
                      <span className="text-xs text-slate-500">{lead.phone}</span>
                    </button>
                    <span className="truncate">{lead.procedureInterest || "Evaluacion"}</span>
                    <span className="truncate">{lead.assignedAgentName || "Sin asignar"}</span>
                    <LeadStatusBadge lead={lead} />
                    <button
                      type="button"
                      onClick={() => callLead(lead.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Llamar
                    </button>
                  </div>
                ))}
              </div>
            </section>
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
          lead={selectedLead}
          stages={stages}
          onClose={() => setSelectedLead(null)}
          onRefresh={refresh}
          onStage={updateStage}
          onCall={callLead}
        />
      ) : null}
    </main>
  );
};

export default Cirugia360Dashboard;

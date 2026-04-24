import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  LayoutDashboard,
  LogOut,
  Pause,
  Phone,
  Play,
  RefreshCcw,
  Save,
  Settings,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
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
    }
  };

  const callLead = async (leadId: string) => {
    setError("");

    try {
      await apiRequest("/api/cirugia360-speed/dashboard?resource=lead-call", {
        method: "POST",
        body: JSON.stringify({ leadId }),
      });
      await refresh();
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : "No pudimos iniciar la llamada.");
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

  return (
    <main className="min-h-screen bg-[#f5f7f8] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Cirugia360</p>
            <h1 className="text-xl font-semibold">Dashboard comercial</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[15rem_1fr]">
        <nav className="h-max rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold ${
                  active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <section className="min-w-0 space-y-4">
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
            <div className="grid gap-3 xl:grid-cols-3">
              {stages.map((stage) => {
                const stageLeads = leads.filter((lead) => lead.pipelineStage === stage.id);

                return (
                  <section key={stage.id} className="min-h-48 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold">{stage.label}</h2>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold">{stageLeads.length}</span>
                    </div>
                    <div className="space-y-3">
                      {stageLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          stages={stages}
                          onSelect={setSelectedLead}
                          onStage={updateStage}
                          onCall={callLead}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
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

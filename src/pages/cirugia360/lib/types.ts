export type DashboardMetric = {
  id: string;
  label: string;
  value: number | null;
  format?: "currency" | "duration";
  tone?: string;
};

export type PipelineStage = {
  id: string;
  label: string;
};

export type LeadNote = {
  id: number;
  createdAt: string;
  updatedAt?: string | null;
  authorEmail: string | null;
  editedByEmail?: string | null;
  body: string;
};

export type TranscriptionSegment = {
  id: string;
  speaker: "agent" | "customer" | "unknown" | string;
  label: string;
  track: string | null;
  text: string;
  timestamp: string | null;
  sequenceId: number | null;
  confidence: number | null;
};

export type DashboardLead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  salesCallStatus: string | null;
  customerCallStatus: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  procedureInterest: string | null;
  message: string | null;
  sourceUrl: string | null;
  paymentStatus?: string | null;
  paymentDueAt?: string | null;
  paymentConfirmedAt?: string | null;
  paymentReference?: string | null;
  bookingReference?: string | null;
  paymentUrl?: string | null;
  externalReferenceCandidates?: string[];
  assignedAgentName: string | null;
  assignedAgentEmail: string | null;
  agentAttempts: number;
  dispatchScheduledAt: string | null;
  callbackContext: string | null;
  customerConnectedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
  pipelineStage: string;
  pipelineOutcome: string;
  pipelineOutcomeReasonCode: string | null;
  pipelineOutcomeReason: string | null;
  pipelineValue: number;
  evaluationScheduledAt?: string | null;
  surgeryBookedAt?: string | null;
  recordingUrl: string | null;
  recordingStatus?: string | null;
  recordingDuration?: number | null;
  transcriptionText: string | null;
  transcriptionStatus?: string | null;
  transcriptionSegments?: TranscriptionSegment[];
  metadata?: Record<string, unknown>;
  notes: LeadNote[];
};

export type AgentSettings = {
  businessTimeZone: string;
  queuePaused: boolean;
  agents: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    active?: boolean;
    accountActive?: boolean;
    authUserId?: string | null;
    password?: string;
    activityAverageSeconds?: number;
    lastAutoDeactivation?: {
      at: string | null;
      reason: string | null;
      leadId: string | null;
      leadName: string | null;
    } | null;
  }>;
};

export type DashboardSnapshot = {
  viewer?: {
    role: "admin" | "agent";
    email: string | null;
  };
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
  agentPerformance?: Array<{
    id: string;
    name: string;
    email: string | null;
    assigned: number;
    contacted: number;
    evaluations: number;
    surgeries: number;
    won: number;
    answeredCalls: number;
    conversionRate: number;
    averageTimeToContactSeconds: number | null;
    activityAverageSeconds?: number;
  }>;
  agentActivityAverages?: Record<string, number>;
  agentStatuses?: Array<{
    id: string;
    name: string;
    email: string | null;
    priority: number;
    status: "free" | "busy" | "inactive";
    activeLeadId: string | null;
    activeLeadName: string | null;
    lastAutoDeactivation?: {
      at: string | null;
      reason: string | null;
      leadId: string | null;
      leadName: string | null;
    } | null;
  }>;
  queue?: Array<{
    id: string;
    createdAt: string;
    fullName: string;
    procedureInterest: string | null;
    assignedAgentName: string | null;
    assignedAgentEmail: string | null;
    waitingSince: string;
    dispatchScheduledAt: string | null;
    status: string;
  }>;
  leads: DashboardLead[];
};

export type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
};

export type CreateLeadPayload = {
  fullName: string;
  phone: string;
  procedureInterest: string;
  assignedAgentId: string;
  pipelineValue: number;
};

export type ToastTone = "success" | "warning" | "error";

export type LossReasonCode = "no_responde" | "precio" | "no_califica_medicamente" | "eligio_otra_clinica" | "otro";

export type ActionOptions = {
  skipToast?: boolean;
  skipUndoToast?: boolean;
  reasonCode?: LossReasonCode | null;
};

export type RefreshOptions = {
  silent?: boolean;
  force?: boolean;
};

export type LeadSortKey = "createdAt" | "fullName" | "procedureInterest" | "assignedAgentName" | "status" | "paymentStatus";

export type SortDirection = "asc" | "desc";

export type DashboardPeriod = "today" | "7d" | "30d" | "month" | "custom";

export type LeadCallResult = {
  leadId: string;
  updatedAt?: string;
  callStarted?: boolean;
  queued?: boolean;
  status?: string;
  salesCallStatus?: string | null;
  customerCallStatus?: string | null;
  customerConnectedAt?: string | null;
  completedAt?: string | null;
  lastError?: string | null;
  dispatchScheduledAt?: string | null;
  assignedAgent?: string | null;
  assignedAgentEmail?: string | null;
  warning?: string;
};

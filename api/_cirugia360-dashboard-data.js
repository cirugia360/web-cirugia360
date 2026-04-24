import { createHash, randomUUID } from "node:crypto";
import { getSpeedAdminClient, getSpeedLeadById, insertSpeedLeadEvent, updateSpeedLead } from "./_cirugia360-speed-db.js";
import { normalizeEmail, normalizeText } from "./_cirugia360-speed-shared.js";

const LEADS_TABLE = "c360_speed_leads";
const EVENTS_TABLE = "c360_speed_lead_events";
const NOTES_TABLE = "c360_speed_lead_notes";
const TRACKING_TABLE = "c360_speed_tracking_events";

export const PIPELINE_STAGES = [
  { id: "nuevo", label: "Nuevo" },
  { id: "contactado", label: "Contactado" },
  { id: "contacto_whatsapp", label: "WhatsApp" },
  { id: "esperando_pago", label: "Esperando pago" },
  { id: "eval_presencial", label: "Evaluacion presencial" },
  { id: "eval_online", label: "Evaluacion online" },
  { id: "presupuesto", label: "Presupuesto" },
  { id: "examenes", label: "Examenes" },
  { id: "cirugia", label: "Cirugia" },
];

const KNOWN_STAGE_IDS = new Set(PIPELINE_STAGES.map((stage) => stage.id));

const toIsoOrNull = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
};

const numberOrZero = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const cleanPhoneForHash = (value) => normalizeText(value).replace(/[^\d]/g, "");

const hashValue = (value) => {
  const normalizedValue = normalizeText(value).toLowerCase();
  return normalizedValue ? createHash("sha256").update(normalizedValue).digest("hex") : null;
};

export const normalizePipelineStage = (value) => {
  const normalizedValue = normalizeText(value).toLowerCase();
  return KNOWN_STAGE_IDS.has(normalizedValue) ? normalizedValue : "nuevo";
};

export const toPublicLead = (lead, notes = []) => ({
  id: lead.id,
  createdAt: lead.created_at,
  updatedAt: lead.updated_at,
  leadKind: lead.lead_kind,
  triggerSource: lead.trigger_source,
  status: lead.status,
  salesCallStatus: lead.sales_call_status,
  customerCallStatus: lead.customer_call_status,
  fullName: lead.full_name,
  phone: lead.phone,
  email: lead.email,
  procedureInterest: lead.procedure_interest,
  message: lead.message,
  summaryText: lead.summary_text,
  sourceUrl: lead.source_url,
  assignedAgentName: lead.assigned_agent_name,
  assignedAgentPhone: lead.assigned_agent_phone,
  assignedAgentEmail: lead.assigned_agent_email,
  agentAttempts: lead.agent_attempts,
  dispatchScheduledAt: lead.dispatch_scheduled_at,
  firstAttemptAt: lead.first_attempt_at,
  customerConnectedAt: lead.customer_connected_at,
  completedAt: lead.completed_at,
  lastError: lead.last_error,
  pipelineStage: normalizePipelineStage(lead.pipeline_stage),
  pipelineOutcome: lead.pipeline_outcome || "active",
  pipelineOutcomeReason: lead.pipeline_outcome_reason,
  pipelineOutcomeAt: lead.pipeline_outcome_at,
  pipelineValue: numberOrZero(lead.pipeline_value),
  evaluationScheduledAt: lead.evaluation_scheduled_at,
  surgeryBookedAt: lead.surgery_booked_at,
  recordingUrl: lead.recording_url,
  recordingStatus: lead.recording_status,
  recordingDuration: lead.recording_duration,
  transcriptionText: lead.transcription_text,
  transcriptionStatus: lead.transcription_status,
  metadata: lead.metadata || {},
  notes,
});

const getDateRange = ({ dateFrom = null, dateTo = null } = {}) => {
  const start = toIsoOrNull(dateFrom);
  const end = toIsoOrNull(dateTo);

  return {
    dateFrom: start,
    dateTo: end,
    label:
      start || end
        ? `${start ? start.slice(0, 10) : "Inicio"} - ${end ? end.slice(0, 10) : "Hoy"}`
        : "Todo el periodo",
  };
};

const getLeadNotes = async (leadIds) => {
  if (!leadIds.length) {
    return new Map();
  }

  const client = getSpeedAdminClient();
  const { data, error } = await client
    .from(NOTES_TABLE)
    .select("*")
    .in("lead_id", leadIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "No se pudieron cargar las notas.");
  }

  const notesByLead = new Map();

  for (const note of data || []) {
    const currentNotes = notesByLead.get(note.lead_id) || [];
    currentNotes.push({
      id: note.id,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      authorEmail: note.author_email,
      editedByEmail: note.edited_by_email,
      body: note.body,
    });
    notesByLead.set(note.lead_id, currentNotes);
  }

  return notesByLead;
};

const buildSpeedMetrics = (leads) => {
  const connected = leads.filter((lead) => lead.customer_connected_at).length;
  const completed = leads.filter((lead) => lead.status === "completed").length;
  const queued = leads.filter((lead) => ["scheduled", "dispatching"].includes(lead.status)).length;
  const lost = leads.filter((lead) => lead.pipeline_outcome === "lost").length;
  const won = leads.filter((lead) => lead.pipeline_outcome === "won").length;
  const totalPipelineValue = leads.reduce(
    (sum, lead) => sum + numberOrZero(lead.pipeline_value),
    0,
  );
  const speedSamples = leads
    .map((lead) => {
      if (!lead.first_attempt_at || !lead.created_at) {
        return null;
      }

      const seconds = (Date.parse(lead.first_attempt_at) - Date.parse(lead.created_at)) / 1000;
      return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
    })
    .filter((value) => value !== null);
  const averageSpeedSeconds = speedSamples.length
    ? Math.round(speedSamples.reduce((sum, value) => sum + value, 0) / speedSamples.length)
    : null;

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
    {
      id: "speed",
      label: "Primer intento",
      value: averageSpeedSeconds,
      format: "duration",
      tone: "slate",
    },
  ];
};

const buildFunnelMetrics = (leads) =>
  PIPELINE_STAGES.map((stage) => ({
    id: stage.id,
    label: stage.label,
    count: leads.filter((lead) => normalizePipelineStage(lead.pipeline_stage) === stage.id).length,
    value: leads
      .filter((lead) => normalizePipelineStage(lead.pipeline_stage) === stage.id)
      .reduce((sum, lead) => sum + numberOrZero(lead.pipeline_value), 0),
  }));

const buildCallMetrics = (leads) => [
  {
    id: "agent_attempts",
    label: "Intentos asesoras",
    value: leads.reduce((sum, lead) => sum + numberOrZero(lead.agent_attempts), 0),
  },
  {
    id: "answered",
    label: "Pacientes conectados",
    value: leads.filter((lead) => lead.customer_connected_at).length,
  },
  {
    id: "unreachable",
    label: "No contactables",
    value: leads.filter((lead) => lead.status === "customer_unreachable").length,
  },
];

export const buildDashboardSnapshot = async (options = {}) => {
  const client = getSpeedAdminClient();
  const dateRange = getDateRange(options);
  let query = client
    .from(LEADS_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (dateRange.dateFrom) {
    query = query.gte("created_at", dateRange.dateFrom);
  }

  if (dateRange.dateTo) {
    query = query.lte("created_at", dateRange.dateTo);
  }

  const { data: leads, error } = await query;

  if (error) {
    throw new Error(error.message || "No se pudieron cargar los leads.");
  }

  const leadIds = (leads || []).map((lead) => lead.id);
  const notesByLead = await getLeadNotes(leadIds);
  const publicLeads = (leads || []).map((lead) => toPublicLead(lead, notesByLead.get(lead.id) || []));

  return {
    dateRange,
    generatedAt: new Date().toISOString(),
    pipelineStages: PIPELINE_STAGES,
    speedMetrics: buildSpeedMetrics(leads || []),
    funnelMetrics: buildFunnelMetrics(leads || []),
    callMetrics: buildCallMetrics(leads || []),
    leads: publicLeads,
  };
};

export const updatePipelineStage = async ({ leadId, stage, at = new Date().toISOString() }) => {
  const lead = await getSpeedLeadById(leadId);

  if (!lead) {
    return null;
  }

  const nextStage = normalizePipelineStage(stage);
  const updates = {
    pipeline_stage: nextStage,
  };

  if (["eval_presencial", "eval_online"].includes(nextStage) && !lead.evaluation_scheduled_at) {
    updates.evaluation_scheduled_at = at;
  }

  if (nextStage === "cirugia" && !lead.surgery_booked_at) {
    updates.surgery_booked_at = at;
  }

  const updatedLead = await updateSpeedLead(lead.id, updates);

  await insertSpeedLeadEvent(lead.id, "lead.pipeline_stage_changed", {
    at,
    stage: nextStage,
  });

  return updatedLead;
};

export const updatePipelineValue = async ({ leadId, pipelineValue, at = new Date().toISOString() }) => {
  const lead = await getSpeedLeadById(leadId);

  if (!lead) {
    return null;
  }

  const updatedLead = await updateSpeedLead(lead.id, {
    pipeline_value: Number(pipelineValue),
  });

  await insertSpeedLeadEvent(lead.id, "lead.pipeline_value_updated", {
    at,
    previousValue: lead.pipeline_value,
    pipelineValue: Number(pipelineValue),
  });

  return updatedLead;
};

export const updatePipelineOutcome = async ({
  leadId,
  outcome,
  reason = null,
  at = new Date().toISOString(),
}) => {
  const lead = await getSpeedLeadById(leadId);

  if (!lead) {
    return null;
  }

  const normalizedOutcome = outcome === "lost" || outcome === "won" ? outcome : "active";
  const updatedLead = await updateSpeedLead(lead.id, {
    pipeline_outcome: normalizedOutcome === "active" ? null : normalizedOutcome,
    pipeline_outcome_reason: normalizedOutcome === "lost" ? normalizeText(reason) || null : null,
    pipeline_outcome_at: normalizedOutcome === "active" ? null : at,
  });

  await insertSpeedLeadEvent(lead.id, "lead.pipeline_outcome_changed", {
    at,
    outcome: normalizedOutcome,
    reason: normalizedOutcome === "lost" ? normalizeText(reason) || null : null,
  });

  return updatedLead;
};

export const addLeadNote = async ({ leadId, body, authorEmail = null }) => {
  const client = getSpeedAdminClient();
  const lead = await getSpeedLeadById(leadId);

  if (!lead) {
    return null;
  }

  const { data, error } = await client
    .from(NOTES_TABLE)
    .insert({
      lead_id: lead.id,
      body: normalizeText(body),
      author_email: normalizeEmail(authorEmail),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "No se pudo guardar la nota.");
  }

  await insertSpeedLeadEvent(lead.id, "lead.note_created", {
    noteId: data.id,
    authorEmail: normalizeEmail(authorEmail),
  });

  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    authorEmail: data.author_email,
    editedByEmail: data.edited_by_email,
    body: data.body,
  };
};

export const updateLeadNote = async ({ noteId, body, authorEmail = null }) => {
  const client = getSpeedAdminClient();
  const noteBody = normalizeText(body);

  const { data: existingNote, error: loadError } = await client
    .from(NOTES_TABLE)
    .select("*")
    .eq("id", noteId)
    .is("deleted_at", null)
    .maybeSingle();

  if (loadError) {
    throw new Error(loadError.message || "No se pudo cargar la nota.");
  }

  if (!existingNote) {
    return null;
  }

  const { data, error } = await client
    .from(NOTES_TABLE)
    .update({
      body: noteBody,
      updated_at: new Date().toISOString(),
      edited_by_email: normalizeEmail(authorEmail),
    })
    .eq("id", existingNote.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "No se pudo actualizar la nota.");
  }

  await insertSpeedLeadEvent(existingNote.lead_id, "lead.note_updated", {
    noteId: data.id,
    authorEmail: normalizeEmail(authorEmail),
  });

  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    authorEmail: data.author_email,
    editedByEmail: data.edited_by_email,
    body: data.body,
  };
};

export const deleteLeadNote = async ({ noteId, authorEmail = null }) => {
  const client = getSpeedAdminClient();
  const deletedAt = new Date().toISOString();

  const { data: existingNote, error: loadError } = await client
    .from(NOTES_TABLE)
    .select("*")
    .eq("id", noteId)
    .is("deleted_at", null)
    .maybeSingle();

  if (loadError) {
    throw new Error(loadError.message || "No se pudo cargar la nota.");
  }

  if (!existingNote) {
    return null;
  }

  const { error } = await client
    .from(NOTES_TABLE)
    .update({
      deleted_at: deletedAt,
      deleted_by_email: normalizeEmail(authorEmail),
    })
    .eq("id", existingNote.id);

  if (error) {
    throw new Error(error.message || "No se pudo eliminar la nota.");
  }

  await insertSpeedLeadEvent(existingNote.lead_id, "lead.note_deleted", {
    noteId: existingNote.id,
    authorEmail: normalizeEmail(authorEmail),
    deletedAt,
  });

  return { id: existingNote.id };
};

export const insertTrackingEvent = async ({
  leadId = null,
  eventName,
  eventSource = "browser",
  sourceUrl = null,
  clientIp = null,
  clientUserAgent = null,
  metadata = {},
  metaEventId = null,
  metaResponse = null,
  metaSuccess = null,
}) => {
  const client = getSpeedAdminClient();
  const { data, error } = await client
    .from(TRACKING_TABLE)
    .insert({
      lead_id: normalizeText(leadId) || null,
      event_name: normalizeText(eventName),
      event_source: normalizeText(eventSource) || "browser",
      source_url: normalizeText(sourceUrl) || null,
      client_ip: normalizeText(clientIp) || null,
      client_user_agent: normalizeText(clientUserAgent) || null,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
      meta_event_id: normalizeText(metaEventId) || null,
      meta_dispatched_at: metaResponse ? new Date().toISOString() : null,
      meta_success: metaSuccess,
      meta_response: metaResponse,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "No se pudo guardar el evento de tracking.");
  }

  return data;
};

export const buildMetaPayloadFromLead = (lead, eventName, eventId, requestContext = {}) => {
  const emailHash = hashValue(lead?.email);
  const phoneHash = hashValue(cleanPhoneForHash(lead?.phone));
  const userData = {
    client_ip_address: requestContext.clientIp || undefined,
    client_user_agent: requestContext.clientUserAgent || undefined,
    em: emailHash ? [emailHash] : undefined,
    ph: phoneHash ? [phoneHash] : undefined,
  };

  return {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: lead?.source_url || requestContext.sourceUrl || undefined,
    user_data: Object.fromEntries(Object.entries(userData).filter(([, value]) => value !== undefined)),
    custom_data: {
      lead_id: lead?.id,
      procedure: lead?.procedure_interest || undefined,
      value: numberOrZero(lead?.pipeline_value) || undefined,
      currency: "CLP",
    },
  };
};

export const dispatchMetaEvent = async ({ lead = null, eventName, requestContext = {} }) => {
  const accessToken = normalizeText(process.env.META_ACCESS_TOKEN);
  const pixelId = normalizeText(process.env.META_PIXEL_ID);
  const apiVersion = normalizeText(process.env.META_API_VERSION) || "v23.0";

  if (!accessToken || !pixelId) {
    return {
      skipped: true,
      success: false,
      response: null,
      eventId: null,
    };
  }

  const eventId = `${eventName}:${lead?.id || "anonymous"}:${randomUUID()}`;
  const eventPayload = buildMetaPayloadFromLead(lead, eventName, eventId, requestContext);
  const body = {
    data: [eventPayload],
    access_token: accessToken,
  };
  const testEventCode = normalizeText(process.env.META_TEST_EVENT_CODE);

  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${pixelId}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const responsePayload = await response.json().catch(() => ({}));

  return {
    skipped: false,
    success: response.ok,
    response: responsePayload,
    eventId,
  };
};

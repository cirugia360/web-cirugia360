import { randomUUID } from "node:crypto";
import {
  claimDueSpeedLeads,
  claimQueuedSpeedLeads,
  claimStaleAgentCallLeads,
  findLeadForPaymentCallback,
  getSpeedLeadById,
  hasActiveLeadForAgent,
  insertSpeedLead,
  insertSpeedLeadEvent,
  updateSpeedLead,
} from "./_cirugia360-speed-db.js";
import {
  normalizeEmail,
  normalizePhoneInput,
  normalizeText,
  uniqueStrings,
} from "./_cirugia360-speed-shared.js";
import { buildLeadSummaryText, createTwilioClient } from "./_cirugia360-speed-twilio.js";

const OPEN_PAYMENT_STATUSES = new Set(["pending", "processing", "open"]);
const POSITIVE_PAYMENT_STATUSES = new Set([
  "approved",
  "authorized",
  "completed",
  "confirmed",
  "ok",
  "paid",
  "pagado",
  "paid_out",
  "success",
  "succeeded",
]);

const ROUTING_KEY = "routing";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toIsoString = (date) => (date instanceof Date ? date.toISOString() : new Date(date).toISOString());

const isAgentActive = (agent) => Boolean(agent) && agent.active !== false;

const getActiveSalesAgents = (config) =>
  (config.salesAgents || []).filter(isAgentActive);

// Lookups resolve against the full list (active + inactive) so we can still
// recognise a historical assignment when the asesora was toggled off.
const getAgentById = (config, agentId) =>
  (config.salesAgents || []).find((agent) => agent.id === agentId) || null;

const getAgentByPhone = (config, phone) =>
  (config.salesAgents || []).find((agent) => agent.phone === phone) || null;

const getRoutingState = (metadata) => {
  const rawRoutingState = isPlainObject(metadata?.[ROUTING_KEY]) ? metadata[ROUTING_KEY] : {};
  const attemptedAgentIds = Array.isArray(rawRoutingState.attemptedAgentIds)
    ? rawRoutingState.attemptedAgentIds.filter((value) => normalizeText(value))
    : [];

  return {
    attemptedAgentIds,
    currentAssignedAgentId: normalizeText(rawRoutingState.currentAssignedAgentId) || null,
    nextStartAgentId: normalizeText(rawRoutingState.nextStartAgentId) || null,
  };
};

const withRoutingState = (metadata, routingState) => ({
  ...(isPlainObject(metadata) ? metadata : {}),
  [ROUTING_KEY]: {
    attemptedAgentIds: uniqueStrings(routingState.attemptedAgentIds || []),
    currentAssignedAgentId: normalizeText(routingState.currentAssignedAgentId) || null,
    nextStartAgentId: normalizeText(routingState.nextStartAgentId) || null,
  },
});

const getAssignedAgent = (config, lead) => {
  const routingState = getRoutingState(lead.metadata);

  return (
    getAgentById(config, routingState.currentAssignedAgentId) ||
    getAgentByPhone(config, lead.assigned_agent_phone) ||
    null
  );
};

const markLeadAsNoAgentAvailable = async (lead, reason) => {
  const updatedLead = await updateSpeedLead(lead.id, {
    status: "no_agent_available",
    sales_call_status: "exhausted",
    dispatch_scheduled_at: null,
    last_error: reason,
  });

  await insertSpeedLeadEvent(lead.id, "sales_call.exhausted", {
    reason,
  });

  return updatedLead;
};

// Reschedule the lead for a later retry without touching its assignment when
// the currently assigned asesora was toggled off from the dashboard. Desactivar
// la vendedora en el panel NO debe perder la relación comercial con sus leads.
const pauseLeadForInactiveAgent = async (lead, config, assignedAgent) => {
  const retryAtIso = buildRetryDate(config).toISOString();
  const agentLabel = assignedAgent?.name || lead.assigned_agent_name || "la asesora asignada";
  const reason = `${agentLabel} está pausada. Reactivala o reasigna el lead manualmente para reanudar las llamadas.`;
  const updatedLead = await updateSpeedLead(lead.id, {
    dispatch_scheduled_at: retryAtIso,
    status: "scheduled",
    sales_call_status: "scheduled",
    twilio_sales_call_sid: null,
    last_error: reason,
  });

  await insertSpeedLeadEvent(lead.id, "sales_call.paused_inactive_agent", {
    scheduledAt: retryAtIso,
    agentId: assignedAgent?.id || null,
    agentName: assignedAgent?.name || lead.assigned_agent_name || null,
    reason,
  });

  return updatedLead;
};

const buildRetryDate = (config, referenceTime = new Date()) =>
  new Date(referenceTime.getTime() + config.retryDelaySeconds * 1000);

const buildLeadDispatchPlan = async (lead, config, referenceTime = new Date(), options = {}) => {
  const excludeAgentIds = new Set(options.excludeAgentIds || []);
  const activeAgents = getActiveSalesAgents(config);
  const priorityAgent = activeAgents.find((agent) => !excludeAgentIds.has(agent.id)) || null;

  if (priorityAgent) {
    const busy = await hasActiveLeadForAgent({
      agentPhone: priorityAgent.phone,
      excludeLeadId: lead.id,
      cooldownSeconds: config.agentCallCooldownSeconds,
      pendingCallStaleSeconds: config.agentPendingCallStaleSeconds,
      activeConversationStaleSeconds: config.agentActiveConversationStaleSeconds,
      referenceTimeIso: referenceTime.toISOString(),
    });

    if (!busy) {
      return {
        agent: priorityAgent,
        immediate: true,
        scheduledAt: referenceTime,
        resetCycle: false,
      };
    }

    return {
      agent: priorityAgent,
      immediate: false,
      scheduledAt: buildRetryDate(config, referenceTime),
      resetCycle: false,
    };
  }

  return {
    agent: null,
    immediate: false,
    scheduledAt: buildRetryDate(config, referenceTime),
    resetCycle: false,
  };
};

const scheduleLeadWithPlan = async (lead, plan, config, reason = null) => {
  const routingState = getRoutingState(lead.metadata);
  const updatedRoutingState = {
    attemptedAgentIds: plan.resetCycle ? [] : routingState.attemptedAgentIds,
    currentAssignedAgentId: plan.agent?.id || null,
    nextStartAgentId: null,
  };
  const scheduledAtIso = toIsoString(plan.scheduledAt);
  const updatedLead = await updateSpeedLead(lead.id, {
    assigned_agent_name: plan.agent?.name || null,
    assigned_agent_phone: plan.agent?.phone || null,
    assigned_agent_email: plan.agent?.email || null,
    dispatch_scheduled_at: scheduledAtIso,
    status: plan.immediate ? "received" : "scheduled",
    sales_call_status: plan.immediate ? "queued" : "scheduled",
    twilio_sales_call_sid: null,
    last_error: plan.immediate ? null : normalizeText(reason) || null,
    metadata: withRoutingState(lead.metadata, updatedRoutingState),
  });

  if (!plan.immediate) {
    await insertSpeedLeadEvent(lead.id, "sales_call.scheduled", {
      scheduledAt: scheduledAtIso,
      agent: plan.agent?.name || null,
      reason: normalizeText(reason) || (plan.agent ? "La asesora prioritaria estaba ocupada." : "No habia asesoras activas."),
    });
  }

  return updatedLead;
};

export const scheduleLeadForNextAttempt = async (lead, config, options = {}) => {
  const referenceTime = options.referenceTime instanceof Date ? options.referenceTime : new Date();
  const plan = await buildLeadDispatchPlan(lead, config, referenceTime, {
    excludeAgentIds: options.excludeAgentIds || [],
  });

  if (!plan) {
    return {
      kind: "exhausted",
      lead: await markLeadAsNoAgentAvailable(
        lead,
        "No encontramos una asesora disponible para este lead.",
      ),
    };
  }

  const updatedLead = await scheduleLeadWithPlan(lead, plan, config, options.reason || null);

  return {
    kind: plan.immediate ? "dispatch" : "scheduled",
    lead: updatedLead,
    scheduledAt: toIsoString(plan.scheduledAt),
  };
};

const scheduleLeadRetryDelay = async (lead, config, reason = null, preferredAgent = null) => {
  const routingState = getRoutingState(lead.metadata);
  const activeAgents = getActiveSalesAgents(config);
  const preferredAgentActive = isAgentActive(preferredAgent) ? preferredAgent : null;
  const currentAssignedAgent = getAssignedAgent(config, lead);
  const assignedAgentActive = isAgentActive(currentAssignedAgent) ? currentAssignedAgent : null;
  const nextAgent =
    preferredAgentActive ||
    assignedAgentActive ||
    activeAgents[0] ||
    null;
  const retryAtIso = buildRetryDate(config).toISOString();
  const attemptedAgentIds =
    routingState.attemptedAgentIds.length >= activeAgents.length
      ? []
      : routingState.attemptedAgentIds;
  const updatedLead = await updateSpeedLead(lead.id, {
    assigned_agent_name: nextAgent?.name || null,
    assigned_agent_phone: nextAgent?.phone || null,
    assigned_agent_email: nextAgent?.email || null,
    dispatch_scheduled_at: retryAtIso,
    status: "scheduled",
    sales_call_status: "scheduled",
    twilio_sales_call_sid: null,
    last_error: normalizeText(reason) || null,
    metadata: withRoutingState(lead.metadata, {
      attemptedAgentIds,
      currentAssignedAgentId: nextAgent?.id || null,
      nextStartAgentId: null,
    }),
  });

  await insertSpeedLeadEvent(lead.id, "sales_call.scheduled", {
    scheduledAt: retryAtIso,
    agent: nextAgent?.name || null,
    reason: normalizeText(reason) || "Reagendado automaticamente.",
  });

  return updatedLead;
};

export const dispatchLeadToAssignedAgent = async (lead, config, options = {}) => {
  if (!config.twilioConfigured) {
    throw new Error(
      "Twilio no esta configurado. Define TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_PHONE_NUMBER.",
    );
  }

  const assignedAgent = getAssignedAgent(config, lead);

  if (!assignedAgent) {
    throw new Error("El lead no tiene una asesora asignada para llamar.");
  }

  const agentBusy = await hasActiveLeadForAgent({
    agentPhone: assignedAgent.phone,
    excludeLeadId: lead.id,
    cooldownSeconds: config.agentCallCooldownSeconds,
    pendingCallStaleSeconds: config.agentPendingCallStaleSeconds,
    activeConversationStaleSeconds: config.agentActiveConversationStaleSeconds,
    referenceTimeIso: new Date().toISOString(),
  });

  if (agentBusy) {
    throw new Error("La asesora asignada sigue ocupada o en cooldown.");
  }

  const client = createTwilioClient(config);
  const nowIso = new Date().toISOString();
  const routingState = getRoutingState(lead.metadata);
  const updatedMetadata = withRoutingState(lead.metadata, {
    attemptedAgentIds: uniqueStrings([...routingState.attemptedAgentIds, assignedAgent.id]),
    currentAssignedAgentId: assignedAgent.id,
    nextStartAgentId: null,
  });
  const call = await client.calls.create({
    to: assignedAgent.phone,
    from: config.twilioPhoneNumber,
    url: `${config.appUrl}/api/cirugia360-speed/twilio/voice/sales-intro?leadId=${encodeURIComponent(
      lead.id,
    )}`,
    method: "POST",
    timeout: config.agentCallTimeoutSeconds,
    statusCallback: `${config.appUrl}/api/cirugia360-speed/twilio/sales-status?leadId=${encodeURIComponent(
      lead.id,
    )}`,
    statusCallbackMethod: "POST",
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
  });

  const updatedLead = await updateSpeedLead(lead.id, {
    status: "dialing_agent",
    sales_call_status: normalizeText(call.status) || "queued",
    twilio_sales_call_sid: call.sid,
    dispatch_scheduled_at: lead.dispatch_scheduled_at || nowIso,
    first_attempt_at: lead.first_attempt_at || nowIso,
    agent_attempts: Math.max(Number(lead.agent_attempts || 0) + 1, 1),
    last_error: null,
    metadata: updatedMetadata,
  });

  await insertSpeedLeadEvent(lead.id, "sales_call.created", {
    callSid: call.sid,
    agent: assignedAgent.name,
    to: assignedAgent.phone,
    source: normalizeText(options.source) || null,
  });

  return updatedLead;
};

export const tryNextAgent = async (lead, config, reason = null) => {
  const currentAgent = getAssignedAgent(config, lead);
  const nextAttempt = await scheduleLeadForNextAttempt(lead, config, {
    excludeAgentIds: currentAgent ? [currentAgent.id] : [],
    reason: normalizeText(reason) || "Reintentando con la siguiente asesora.",
  });

  if (nextAttempt.kind === "exhausted") {
    return "exhausted";
  }

  if (nextAttempt.kind === "scheduled") {
    return "scheduled";
  }

  try {
    await dispatchLeadToAssignedAgent(nextAttempt.lead, config, {
      source: "retry",
    });
    return "dispatched";
  } catch (error) {
    await scheduleLeadRetryDelay(
      nextAttempt.lead,
      config,
      error instanceof Error ? error.message : "No pudimos reintentar con otra asesora.",
      getAssignedAgent(config, nextAttempt.lead),
    );
    return "scheduled";
  }
};

const buildBaseLeadRow = ({
  fullName,
  phone,
  email = null,
  procedure = null,
  message = null,
  sourceUrl = null,
  leadKind,
  triggerSource,
  paymentStatus = "not_required",
  paymentDueAt = null,
  paymentConfirmedAt = null,
  paymentReference = null,
  bookingReference = null,
  paymentUrl = null,
  externalReferences = [],
  metadata = {},
}) => {
  const normalizedFullName = normalizeText(fullName);
  const normalizedProcedure = normalizeText(procedure) || null;
  const normalizedMessage = normalizeText(message) || null;

  return {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lead_kind: leadKind,
    trigger_source: triggerSource,
    status: paymentStatus === "pending" ? "scheduled" : "received",
    sales_call_status: paymentStatus === "pending" ? "scheduled" : null,
    customer_call_status: null,
    full_name: normalizedFullName,
    phone,
    email,
    procedure_interest: normalizedProcedure,
    message: normalizedMessage,
    summary_text: buildLeadSummaryText({
      lead_kind: leadKind,
      full_name: normalizedFullName,
      procedure_interest: normalizedProcedure,
      message: normalizedMessage,
    }),
    source_url: normalizeText(sourceUrl) || null,
    payment_status: paymentStatus,
    payment_due_at: paymentDueAt,
    payment_confirmed_at: paymentConfirmedAt,
    payment_reference: normalizeText(paymentReference) || null,
    booking_reference: normalizeText(bookingReference) || null,
    payment_url: normalizeText(paymentUrl) || null,
    external_reference_candidates: externalReferences,
    assigned_agent_name: null,
    assigned_agent_phone: null,
    assigned_agent_email: null,
    agent_attempts: 0,
    dispatch_scheduled_at: paymentStatus === "pending" ? paymentDueAt : null,
    first_attempt_at: null,
    customer_connected_at: null,
    completed_at: null,
    twilio_sales_call_sid: null,
    twilio_customer_call_sid: null,
    last_error: null,
    metadata: withRoutingState(metadata, {
      attemptedAgentIds: [],
      currentAssignedAgentId: null,
      nextStartAgentId: null,
    }),
  };
};

export const createContactLead = async (payload, config) => {
  const normalizedPhone = normalizePhoneInput(payload.phone, config.defaultCountryDialCode);
  const lead = await insertSpeedLead(
    buildBaseLeadRow({
      fullName: payload.fullName,
      phone: normalizedPhone,
      email: normalizeEmail(payload.email),
      procedure: payload.procedure,
      message: payload.message,
      sourceUrl: payload.sourceUrl,
      leadKind: "contact_request",
      triggerSource: "contact_request",
      metadata: payload.metadata || {},
    }),
  );

  await insertSpeedLeadEvent(lead.id, "lead.created", {
    source: "contact_request",
    leadKind: lead.lead_kind,
  });

  const nextAttempt = await scheduleLeadForNextAttempt(lead, config, {
    reason: "Paciente solicito ser contactado.",
  });

  if (nextAttempt.kind === "scheduled") {
    return {
      lead: nextAttempt.lead,
      callStarted: false,
      queued: true,
      dispatchScheduledAt: nextAttempt.scheduledAt,
      warning: "No habia una asesora libre en este instante. El lead quedo en cola.",
    };
  }

  if (nextAttempt.kind === "exhausted") {
    return {
      lead: nextAttempt.lead,
      callStarted: false,
      queued: false,
      dispatchScheduledAt: null,
      warning: "No encontramos una asesora disponible para este lead.",
    };
  }

  try {
    const dispatchedLead = await dispatchLeadToAssignedAgent(nextAttempt.lead, config, {
      source: "contact_request",
    });

    return {
      lead: dispatchedLead,
      callStarted: true,
      queued: false,
      dispatchScheduledAt: dispatchedLead.dispatch_scheduled_at,
      warning: null,
    };
  } catch (error) {
    const rescheduledLead = await scheduleLeadRetryDelay(
      nextAttempt.lead,
      config,
      error instanceof Error ? error.message : "No pudimos iniciar la llamada ahora mismo.",
      getAssignedAgent(config, nextAttempt.lead),
    );

    return {
      lead: rescheduledLead,
      callStarted: false,
      queued: true,
      dispatchScheduledAt: rescheduledLead.dispatch_scheduled_at,
      warning:
        error instanceof Error
          ? error.message
          : "No pudimos iniciar la llamada ahora mismo.",
    };
  }
};

const isProbablyUrl = (value) => /^https?:\/\//i.test(normalizeText(value));

const collectReferenceCandidates = (payload, parentKey = "", matches = []) => {
  if (typeof payload === "string" || typeof payload === "number") {
    const normalizedValue = normalizeText(payload);
    const normalizedKey = normalizeText(parentKey).toLowerCase();

    if (
      normalizedValue &&
      !isProbablyUrl(normalizedValue) &&
      /(id|uuid|folio|codigo|booking|appointment|cita|reserva|venta|payment|order|token|transaccion|transaction)/i.test(
        normalizedKey,
      )
    ) {
      matches.push({
        key: normalizedKey,
        value: normalizedValue,
      });
    }

    return matches;
  }

  if (!payload || typeof payload !== "object") {
    return matches;
  }

  if (Array.isArray(payload)) {
    payload.forEach((item) => collectReferenceCandidates(item, parentKey, matches));
    return matches;
  }

  Object.entries(payload).forEach(([key, value]) => {
    collectReferenceCandidates(value, key, matches);
  });

  return matches;
};

export const extractExternalReferenceCandidates = (payload) =>
  uniqueStrings(collectReferenceCandidates(payload).map((match) => match.value)).slice(0, 20);

export const extractPaymentReference = (payload) => {
  const match = collectReferenceCandidates(payload).find(({ key }) =>
    /(payment|venta|folio|order|transaccion|transaction|token)/i.test(key),
  );

  return normalizeText(match?.value) || "";
};

export const extractBookingReference = (payload) => {
  const match = collectReferenceCandidates(payload).find(({ key }) =>
    /(booking|appointment|cita|reserva|agenda|uuid)/i.test(key),
  );

  return normalizeText(match?.value) || "";
};

export const createBookingLeadFromBooking = async ({
  bookingPayload,
  bookingResponse,
  sourceUrl = "",
}, config) => {
  const paymentUrl =
    normalizeText(bookingResponse?.paymentUrl) ||
    normalizeText(bookingResponse?.paymentRedirect?.url);

  const fullName = [
    bookingPayload?.personal?.firstName,
    bookingPayload?.personal?.lastName1,
    bookingPayload?.personal?.lastName2,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ") || "Paciente";
  const bookingReference = extractBookingReference(bookingResponse?.source);
  const lead = await insertSpeedLead(
    buildBaseLeadRow({
      fullName,
      phone: normalizePhoneInput(bookingPayload?.personal?.phone, config.defaultCountryDialCode),
      email: normalizeEmail(bookingPayload?.personal?.email),
      procedure:
        normalizeText(bookingPayload?.procedureInterest) ||
        normalizeText(bookingResponse?.option?.procedureName) ||
        normalizeText(bookingResponse?.option?.label) ||
        "Evaluacion",
      message:
        "Agendo una evaluacion desde la pagina. Llamar para confirmar detalles y acompanar el proceso de pago si corresponde.",
      sourceUrl,
      leadKind: "booking_request",
      triggerSource: "reservo_booking_created",
      paymentStatus: "not_required",
      bookingReference,
      paymentUrl,
      externalReferences: extractExternalReferenceCandidates(bookingResponse?.source),
      metadata: {
        appointmentType: normalizeText(bookingPayload?.appointmentType) || null,
        procedureInterest: normalizeText(bookingPayload?.procedureInterest) || null,
        selectedSlot: bookingResponse?.selectedSlot || null,
        callbackMode: "booking_follow_up",
        hasPaymentUrl: Boolean(paymentUrl),
      },
    }),
  );

  await insertSpeedLeadEvent(lead.id, "lead.created", {
    source: "reservo_booking_created",
    leadKind: lead.lead_kind,
    bookingReference: bookingReference || null,
  });

  const nextAttempt = await scheduleLeadForNextAttempt(lead, config, {
    reason: "Paciente agendo una evaluacion desde la pagina.",
  });

  if (nextAttempt.kind === "scheduled") {
    return {
      leadId: nextAttempt.lead.id,
      callStarted: false,
      queued: true,
      dispatchScheduledAt: nextAttempt.scheduledAt,
      assignedAgent: nextAttempt.lead.assigned_agent_name,
      bookingReference: bookingReference || null,
      warning: "No habia una asesora libre en este instante. El lead quedo en cola.",
    };
  }

  if (nextAttempt.kind === "exhausted") {
    return {
      leadId: nextAttempt.lead.id,
      callStarted: false,
      queued: false,
      dispatchScheduledAt: null,
      assignedAgent: nextAttempt.lead.assigned_agent_name,
      bookingReference: bookingReference || null,
      warning: "No encontramos una asesora disponible para este lead.",
    };
  }

  try {
    const dispatchedLead = await dispatchLeadToAssignedAgent(nextAttempt.lead, config, {
      source: "reservo_booking_created",
    });

    return {
      leadId: dispatchedLead.id,
      callStarted: true,
      queued: false,
      dispatchScheduledAt: dispatchedLead.dispatch_scheduled_at,
      assignedAgent: dispatchedLead.assigned_agent_name,
      bookingReference: bookingReference || null,
      warning: null,
    };
  } catch (error) {
    const rescheduledLead = await scheduleLeadRetryDelay(
      nextAttempt.lead,
      config,
      error instanceof Error ? error.message : "No pudimos iniciar la llamada ahora mismo.",
      getAssignedAgent(config, nextAttempt.lead),
    );

    return {
      leadId: rescheduledLead.id,
      callStarted: false,
      queued: true,
      dispatchScheduledAt: rescheduledLead.dispatch_scheduled_at,
      assignedAgent: rescheduledLead.assigned_agent_name,
      bookingReference: bookingReference || null,
      warning:
        error instanceof Error
          ? error.message
          : "No pudimos iniciar la llamada ahora mismo.",
    };
  }
};

export const triggerLeadPhoneCall = async (leadId, config, options = {}) => {
  const lead = await getSpeedLeadById(leadId);

  if (!lead) {
    return {
      found: false,
      lead: null,
    };
  }

  const preparedLead = await updateSpeedLead(lead.id, {
    status: "received",
    sales_call_status: "queued",
    customer_call_status: null,
    twilio_sales_call_sid: null,
    twilio_customer_call_sid: null,
    completed_at: null,
    last_error: null,
  });
  const nextAttempt = await scheduleLeadForNextAttempt(preparedLead, config, {
    reason: normalizeText(options.reason) || "Llamada solicitada desde dashboard.",
  });

  if (nextAttempt.kind === "scheduled") {
    return {
      found: true,
      lead: nextAttempt.lead,
      callStarted: false,
      queued: true,
      dispatchScheduledAt: nextAttempt.scheduledAt,
      warning: "No habia una asesora libre en este instante. El lead quedo en cola.",
    };
  }

  if (nextAttempt.kind === "exhausted") {
    return {
      found: true,
      lead: nextAttempt.lead,
      callStarted: false,
      queued: false,
      dispatchScheduledAt: null,
      warning: "No encontramos una asesora disponible para este lead.",
    };
  }

  try {
    const dispatchedLead = await dispatchLeadToAssignedAgent(nextAttempt.lead, config, {
      source: "dashboard_manual_call",
    });

    return {
      found: true,
      lead: dispatchedLead,
      callStarted: true,
      queued: false,
      dispatchScheduledAt: dispatchedLead.dispatch_scheduled_at,
      warning: null,
    };
  } catch (error) {
    const rescheduledLead = await scheduleLeadRetryDelay(
      nextAttempt.lead,
      config,
      error instanceof Error ? error.message : "No pudimos iniciar la llamada ahora mismo.",
      getAssignedAgent(config, nextAttempt.lead),
    );

    return {
      found: true,
      lead: rescheduledLead,
      callStarted: false,
      queued: true,
      dispatchScheduledAt: rescheduledLead.dispatch_scheduled_at,
      warning:
        error instanceof Error
          ? error.message
          : "No pudimos iniciar la llamada ahora mismo.",
    };
  }
};

export const isPositivePaymentStatus = (value) =>
  POSITIVE_PAYMENT_STATUSES.has(normalizeText(value).toLowerCase());

export const confirmLeadPayment = async (lookup, callbackPayload = {}) => {
  const lead = await findLeadForPaymentCallback(lookup);

  if (!lead) {
    return {
      found: false,
      updated: false,
      lead: null,
    };
  }

  if (!OPEN_PAYMENT_STATUSES.has(normalizeText(lead.payment_status).toLowerCase())) {
    return {
      found: true,
      updated: false,
      lead,
    };
  }

  const nowIso = new Date().toISOString();
  const nextStatus = ["scheduled", "dispatching", "received"].includes(normalizeText(lead.status))
    ? "payment_confirmed"
    : lead.status;
  const updatedLead = await updateSpeedLead(lead.id, {
    payment_status: "confirmed",
    payment_confirmed_at: nowIso,
    dispatch_scheduled_at: nextStatus === "payment_confirmed" ? null : lead.dispatch_scheduled_at,
    status: nextStatus,
    sales_call_status: nextStatus === "payment_confirmed" ? "payment_confirmed" : lead.sales_call_status,
    last_error: null,
    metadata: {
      ...(isPlainObject(lead.metadata) ? lead.metadata : {}),
      paymentCallbackReceivedAt: nowIso,
      paymentCallbackPayload: callbackPayload,
    },
  });

  await insertSpeedLeadEvent(lead.id, "payment.confirmed", {
    at: nowIso,
    paymentReference: normalizeText(lookup.paymentReference) || lead.payment_reference,
    bookingReference: normalizeText(lookup.bookingReference) || lead.booking_reference,
  });

  return {
    found: true,
    updated: true,
    lead: updatedLead,
  };
};

export const dispatchDueLeads = async (config, limit = 20, options = {}) => {
  const result = {
    claimed: 0,
    dispatched: 0,
    rescheduled: 0,
    exhausted: 0,
    skippedPaid: 0,
    pausedInactiveAgent: 0,
    staleRecovered: 0,
    failed: 0,
    paused: config.queuePaused,
    leadIds: [],
  };

  if (config.queuePaused) {
    return result;
  }

  const claimedLeads = options.includeFuture === true
    ? await claimQueuedSpeedLeads(limit)
    : await claimDueSpeedLeads(limit);
  const staleLeads = await claimStaleAgentCallLeads({
    limit,
    staleBeforeIso: new Date(
      Date.now() - (config.agentPendingCallStaleSeconds || 120) * 1000,
    ).toISOString(),
  });
  const claimedLeadIds = new Set();
  const leadsToProcess = [];

  for (const lead of [...claimedLeads, ...staleLeads]) {
    if (!claimedLeadIds.has(lead.id)) {
      claimedLeadIds.add(lead.id);
      leadsToProcess.push(lead);
    }
  }

  result.staleRecovered = staleLeads.length;
  result.claimed = leadsToProcess.length;

  for (const claimedLead of leadsToProcess) {
    result.leadIds.push(claimedLead.id);

    if (normalizeText(claimedLead.payment_status).toLowerCase() === "confirmed") {
      await updateSpeedLead(claimedLead.id, {
        status: "payment_confirmed",
        sales_call_status: "payment_confirmed",
        dispatch_scheduled_at: null,
        last_error: null,
      });
      result.skippedPaid += 1;
      continue;
    }

    try {
      const lead = (await getSpeedLeadById(claimedLead.id)) || claimedLead;

      // If the lead is already assigned to an asesora that is currently
      // inactive in settings, pause the lead for a retry without touching
      // its assignment. That way "desactivar" no se confunde con "eliminar".
      const assignedAgent = getAssignedAgent(config, lead);
      if (assignedAgent && !isAgentActive(assignedAgent)) {
        await pauseLeadForInactiveAgent(lead, config, assignedAgent);
        result.pausedInactiveAgent += 1;
        result.rescheduled += 1;
        continue;
      }

      const nextAttempt = await scheduleLeadForNextAttempt(lead, config, {
        reason: "Lead reclamado desde la cola.",
      });

      if (nextAttempt.kind === "scheduled") {
        result.rescheduled += 1;
        continue;
      }

      if (nextAttempt.kind === "exhausted") {
        result.exhausted += 1;
        continue;
      }

      await dispatchLeadToAssignedAgent(nextAttempt.lead, config, {
        source: "queue_dispatch",
      });
      result.dispatched += 1;
    } catch (error) {
      const latestLead = (await getSpeedLeadById(claimedLead.id)) || claimedLead;
      await scheduleLeadRetryDelay(
        latestLead,
        config,
        error instanceof Error ? error.message : "No pudimos procesar el lead de la cola.",
        getAssignedAgent(config, latestLead),
      );
      result.failed += 1;
    }
  }

  return result;
};

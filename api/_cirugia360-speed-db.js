import { createClient } from "@supabase/supabase-js";
import { normalizeText } from "./_cirugia360-speed-shared.js";

const LEADS_TABLE = normalizeText(process.env.CIRUGIA360_STL_LEADS_TABLE) || "c360_speed_leads";
const EVENTS_TABLE =
  normalizeText(process.env.CIRUGIA360_STL_EVENTS_TABLE) || "c360_speed_lead_events";
const CLAIM_RPC =
  normalizeText(process.env.CIRUGIA360_STL_CLAIM_RPC) || "c360_claim_due_speed_leads";
const CLAIM_QUEUED_RPC =
  normalizeText(process.env.CIRUGIA360_STL_CLAIM_QUEUED_RPC) || "c360_claim_queued_speed_leads";

const ACTIVE_AGENT_STATUSES = [
  "dialing_agent",
  "waiting_agent_confirmation",
  "connecting_customer",
  "customer_connected",
];
const PENDING_AGENT_STATUSES = new Set(["dialing_agent", "waiting_agent_confirmation"]);
const STALE_QUEUE_STATUSES = ["dispatching", ...PENDING_AGENT_STATUSES];
const DEFAULT_PENDING_CALL_STALE_SECONDS = 45;
const DEFAULT_ACTIVE_CONVERSATION_STALE_SECONDS = 3 * 60 * 60;

const isFreshActiveLead = (
  lead,
  referenceTimeIso,
  pendingCallStaleSeconds = DEFAULT_PENDING_CALL_STALE_SECONDS,
  activeConversationStaleSeconds = DEFAULT_ACTIVE_CONVERSATION_STALE_SECONDS,
) => {
  const updatedAt = Date.parse(lead?.updated_at || lead?.created_at || "");

  if (!Number.isFinite(updatedAt)) {
    return false;
  }

  const referenceTime = Date.parse(referenceTimeIso);
  const maxAgeSeconds = PENDING_AGENT_STATUSES.has(lead.status)
    ? pendingCallStaleSeconds
    : activeConversationStaleSeconds;

  return Number.isFinite(referenceTime) && referenceTime - updatedAt <= maxAgeSeconds * 1000;
};

export const getSpeedAdminClient = () => {
  const supabaseUrl = normalizeText(process.env.SUPABASE_URL);
  const serviceRoleKey = normalizeText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para Cirugia360 Speed.");
  }

  if (!globalThis.__cirugia360SpeedSupabaseAdmin__) {
    globalThis.__cirugia360SpeedSupabaseAdmin__ = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return globalThis.__cirugia360SpeedSupabaseAdmin__;
};

const throwIfError = (error, fallbackMessage) => {
  if (!error) {
    return;
  }

  const message = normalizeText(error.message) || fallbackMessage;
  throw new Error(message);
};

export const insertSpeedLead = async (lead) => {
  const client = getSpeedAdminClient();
  const { data, error } = await client.from(LEADS_TABLE).insert(lead).select("*").single();

  throwIfError(error, "No se pudo guardar el lead.");
  return data;
};

export const getSpeedLeadById = async (leadId) => {
  if (!normalizeText(leadId)) {
    return null;
  }

  const client = getSpeedAdminClient();
  const { data, error } = await client.from(LEADS_TABLE).select("*").eq("id", leadId).maybeSingle();

  throwIfError(error, "No se pudo cargar el lead.");
  return data || null;
};

export const updateSpeedLead = async (leadId, updates) => {
  const client = getSpeedAdminClient();
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from(LEADS_TABLE)
    .update(payload)
    .eq("id", leadId)
    .select("*")
    .single();

  throwIfError(error, "No se pudo actualizar el lead.");
  return data;
};

export const insertSpeedLeadEvent = async (leadId, eventType, payload = {}) => {
  const client = getSpeedAdminClient();
  const { error } = await client.from(EVENTS_TABLE).insert({
    lead_id: leadId,
    event_type: eventType,
    payload,
  });

  throwIfError(error, "No se pudo guardar el evento del lead.");
};

export const claimDueSpeedLeads = async (limit = 20) => {
  const client = getSpeedAdminClient();
  const { data, error } = await client.rpc(CLAIM_RPC, {
    p_limit: limit,
    p_now: new Date().toISOString(),
  });

  throwIfError(error, "No se pudo reclamar la cola de Speed-to-Lead.");
  return Array.isArray(data) ? data : [];
};

export const claimQueuedSpeedLeads = async (limit = 50) => {
  const client = getSpeedAdminClient();
  const { data, error } = await client.rpc(CLAIM_QUEUED_RPC, {
    p_limit: limit,
  });

  throwIfError(error, "No se pudo reclamar la cola completa de Speed-to-Lead.");
  return Array.isArray(data) ? data : [];
};

export const claimStaleAgentCallLeads = async ({
  limit = 20,
  staleBeforeIso = new Date(Date.now() - DEFAULT_PENDING_CALL_STALE_SECONDS * 1000).toISOString(),
} = {}) => {
  const client = getSpeedAdminClient();
  const { data: staleLeads, error: selectError } = await client
    .from(LEADS_TABLE)
    .select("*")
    .in("status", STALE_QUEUE_STATUSES)
    .lt("updated_at", staleBeforeIso)
    .or("payment_status.is.null,payment_status.neq.confirmed")
    .order("created_at", { ascending: false })
    .limit(Math.max(Number(limit) || 20, 1));

  throwIfError(selectError, "No se pudo buscar llamadas vencidas.");

  const claimedLeads = [];

  for (const lead of staleLeads || []) {
    const { data, error } = await client
      .from(LEADS_TABLE)
      .update({
        status: "dispatching",
        sales_call_status: "stale",
        twilio_sales_call_sid: null,
        last_error: "El intento de llamada a la asesora vencio.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id)
      .in("status", STALE_QUEUE_STATUSES)
      .select("*")
      .maybeSingle();

    throwIfError(error, "No se pudo recuperar una llamada vencida.");

    if (data) {
      claimedLeads.push(data);
    }
  }

  return claimedLeads;
};

export const hasActiveLeadForAgent = async ({
  agentPhone,
  excludeLeadId = null,
  cooldownSeconds = 0,
  referenceTimeIso = new Date().toISOString(),
  pendingCallStaleSeconds = DEFAULT_PENDING_CALL_STALE_SECONDS,
  activeConversationStaleSeconds = DEFAULT_ACTIVE_CONVERSATION_STALE_SECONDS,
}) => {
  const client = getSpeedAdminClient();
  let activeQuery = client
    .from(LEADS_TABLE)
    .select("id, status, created_at, updated_at")
    .eq("assigned_agent_phone", agentPhone)
    .in("status", ACTIVE_AGENT_STATUSES)
    .limit(20);

  if (excludeLeadId) {
    activeQuery = activeQuery.neq("id", excludeLeadId);
  }

  const { data: activeRows, error: activeError } = await activeQuery;
  throwIfError(activeError, "No se pudo revisar si la asesora esta ocupada.");

  if (
    Array.isArray(activeRows) &&
    activeRows.some((lead) =>
      isFreshActiveLead(
        lead,
        referenceTimeIso,
        pendingCallStaleSeconds,
        activeConversationStaleSeconds,
      ),
    )
  ) {
    return true;
  }

  if (cooldownSeconds <= 0) {
    return false;
  }

  const thresholdIso = new Date(
    Date.parse(referenceTimeIso) - cooldownSeconds * 1000,
  ).toISOString();
  let cooldownQuery = client
    .from(LEADS_TABLE)
    .select("id")
    .eq("assigned_agent_phone", agentPhone)
    .eq("status", "completed")
    .gte("completed_at", thresholdIso)
    .limit(1);

  if (excludeLeadId) {
    cooldownQuery = cooldownQuery.neq("id", excludeLeadId);
  }

  const { data: cooldownRows, error: cooldownError } = await cooldownQuery;
  throwIfError(cooldownError, "No se pudo revisar el cooldown de la asesora.");

  return Array.isArray(cooldownRows) && cooldownRows.length > 0;
};

export const findLeadForPaymentCallback = async ({
  leadId = "",
  paymentReference = "",
  bookingReference = "",
}) => {
  const client = getSpeedAdminClient();

  if (normalizeText(leadId)) {
    const { data, error } = await client
      .from(LEADS_TABLE)
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    throwIfError(error, "No se pudo buscar el lead por id.");

    if (data) {
      return data;
    }
  }

  if (normalizeText(paymentReference)) {
    const { data, error } = await client
      .from(LEADS_TABLE)
      .select("*")
      .eq("payment_reference", paymentReference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    throwIfError(error, "No se pudo buscar el lead por payment_reference.");

    if (data) {
      return data;
    }
  }

  if (normalizeText(bookingReference)) {
    const { data, error } = await client
      .from(LEADS_TABLE)
      .select("*")
      .eq("booking_reference", bookingReference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    throwIfError(error, "No se pudo buscar el lead por booking_reference.");

    if (data) {
      return data;
    }
  }

  return null;
};

export const getLeadBySalesCallSid = async (callSid) => {
  const client = getSpeedAdminClient();
  const { data, error } = await client
    .from(LEADS_TABLE)
    .select("*")
    .eq("twilio_sales_call_sid", callSid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(error, "No se pudo buscar el lead por sales call sid.");
  return data || null;
};

export const getLeadByCustomerCallSid = async (callSid) => {
  const client = getSpeedAdminClient();
  const { data, error } = await client
    .from(LEADS_TABLE)
    .select("*")
    .eq("twilio_customer_call_sid", callSid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(error, "No se pudo buscar el lead por customer call sid.");
  return data || null;
};

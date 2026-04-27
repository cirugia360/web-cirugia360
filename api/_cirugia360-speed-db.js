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

export const hasActiveLeadForAgent = async ({
  agentPhone,
  excludeLeadId = null,
  cooldownSeconds = 0,
  referenceTimeIso = new Date().toISOString(),
}) => {
  const client = getSpeedAdminClient();
  let activeQuery = client
    .from(LEADS_TABLE)
    .select("id")
    .eq("assigned_agent_phone", agentPhone)
    .in("status", ACTIVE_AGENT_STATUSES)
    .limit(1);

  if (excludeLeadId) {
    activeQuery = activeQuery.neq("id", excludeLeadId);
  }

  const { data: activeRows, error: activeError } = await activeQuery;
  throwIfError(activeError, "No se pudo revisar si la asesora esta ocupada.");

  if (Array.isArray(activeRows) && activeRows.length > 0) {
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

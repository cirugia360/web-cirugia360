import { randomUUID } from "node:crypto";
import twilio from "twilio";
import {
  getHeader,
  getRequestUrl,
  getFirstQueryValue,
  normalizeText,
} from "./_cirugia360-speed-shared.js";

const ACTIVE_SALES_STATUSES = ["dialing_agent", "waiting_agent_confirmation"];
const ACTIVE_CUSTOMER_STATUSES = ["connecting_customer", "customer_connected"];

const sanitizeSpeechFragment = (value) =>
  normalizeText(value).replace(/[<>]/g, "").replace(/\s+/g, " ");

const truncateSpeechFragment = (value, maxLength) => {
  const sanitized = sanitizeSpeechFragment(value);

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxLength).trim().replace(/[.,;:!?-]+$/, "")}...`;
};

export const buildLeadSummaryText = (lead) => {
  const comment =
    lead.message && normalizeText(lead.message)
      ? `Comentario: ${truncateSpeechFragment(lead.message, 160)}.`
      : "Comentario: Sin comentario.";
  const paymentContext =
    lead.lead_kind === "payment_recovery"
      ? "La paciente agendo una evaluacion y no completo el pago dentro del tiempo esperado."
      : null;
  const procedureContext = lead.procedure_interest
    ? `Procedimiento: ${sanitizeSpeechFragment(lead.procedure_interest)}.`
    : null;

  return [
    `Nombre: ${sanitizeSpeechFragment(lead.full_name)}.`,
    paymentContext,
    procedureContext,
    comment,
    "Presiona 1 para llamar ahora.",
  ]
    .filter(Boolean)
    .join(" ");
};

export const createTwilioClient = (config) =>
  twilio(config.twilioAccountSid, config.twilioAuthToken);

export const createVoiceResponse = () => new twilio.twiml.VoiceResponse();

export const sayInSpanish = (target, text) => {
  target.say({ language: "es-ES" }, text);
};

export const dialLeadFromActiveCall = (response, config, lead, conversationId = randomUUID()) => {
  const customerStatusUrl = `${config.appUrl}/api/cirugia360-speed/twilio/customer-status?leadId=${encodeURIComponent(
    lead.id,
  )}&conversationId=${encodeURIComponent(conversationId)}`;
  const recordingStatusUrl = `${config.appUrl}/api/cirugia360-speed/twilio/recording-status?leadId=${encodeURIComponent(
    lead.id,
  )}&conversationId=${encodeURIComponent(conversationId)}`;
  const customerCompleteUrl = `${config.appUrl}/api/cirugia360-speed/twilio/voice/customer-complete?leadId=${encodeURIComponent(
    lead.id,
  )}&conversationId=${encodeURIComponent(conversationId)}`;
  const dial = response.dial({
    callerId: config.twilioPhoneNumber,
    answerOnBridge: true,
    action: customerCompleteUrl,
    method: "POST",
    record: "record-from-answer-dual",
    recordingStatusCallback: recordingStatusUrl,
    recordingStatusCallbackMethod: "POST",
    recordingStatusCallbackEvent: "completed",
  });

  dial.number(
    {
      statusCallback: customerStatusUrl,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    },
    lead.phone,
  );
};

export const canRetryAgent = (lead) =>
  !["connecting_customer", "customer_connected", "completed", "payment_confirmed"].includes(
    normalizeText(lead.status),
  );

const normalizeCallSid = (value) => normalizeText(value) || null;

export const isStaleSalesStatusCallback = (lead, callSid) => {
  const activeCallSid = normalizeCallSid(lead.twilio_sales_call_sid);
  const callbackCallSid = normalizeCallSid(callSid);

  if (activeCallSid) {
    return callbackCallSid !== activeCallSid;
  }

  return !ACTIVE_SALES_STATUSES.includes(normalizeText(lead.status));
};

export const isStaleCustomerStatusCallback = (lead, callSid) => {
  const activeCallSid = normalizeCallSid(lead.twilio_customer_call_sid);
  const callbackCallSid = normalizeCallSid(callSid);

  if (activeCallSid) {
    return callbackCallSid !== activeCallSid;
  }

  return !ACTIVE_CUSTOMER_STATUSES.includes(normalizeText(lead.status));
};

const normalizeTwilioValidationUrl = (rawUrl, action) => {
  const url = new URL(rawUrl);

  if (action) {
    url.searchParams.delete("action");
  }

  return url.toString();
};

const buildConfiguredHostRequestUrl = (request, config) => {
  const requestUrl = new URL(request.url || "/", config.appUrl);

  return new URL(`${requestUrl.pathname}${requestUrl.search}`, config.appUrl).toString();
};

const getTwilioValidationUrls = (request, config) => {
  const action = getFirstQueryValue(request.query?.action);
  const candidates = new Set();

  try {
    candidates.add(normalizeTwilioValidationUrl(getRequestUrl(request), action));
  } catch {
    // Ignore malformed request URLs.
  }

  try {
    candidates.add(
      normalizeTwilioValidationUrl(new URL(request.url || "/", config.appUrl).toString(), action),
    );
  } catch {
    // Ignore malformed fallback URLs.
  }

  try {
    candidates.add(normalizeTwilioValidationUrl(buildConfiguredHostRequestUrl(request, config), action));
  } catch {
    // Ignore malformed configured-host URLs.
  }

  return [...candidates];
};

export const validateTwilioRequestIfNeeded = (request, config, params) => {
  if (!config.validateTwilioSignature) {
    return true;
  }

  const signature = getHeader(request, "x-twilio-signature");

  if (!signature) {
    return false;
  }

  const validationParams = request.method === "GET" ? {} : params;

  return getTwilioValidationUrls(request, config).some((url) =>
    twilio.validateRequest(config.twilioAuthToken, signature, url, validationParams),
  );
};

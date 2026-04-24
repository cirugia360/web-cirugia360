import { randomUUID } from "node:crypto";
import { getCirugia360SpeedConfigWithSettings } from "../../../_cirugia360-speed-config.js";
import {
  getFirstQueryValue,
  methodNotAllowed,
  readFormBody,
  sendJson,
  sendXml,
} from "../../../_cirugia360-speed-shared.js";
import {
  getSpeedLeadById,
  insertSpeedLeadEvent,
  updateSpeedLead,
} from "../../../_cirugia360-speed-db.js";
import {
  buildLeadSummaryText,
  canRetryAgent,
  createVoiceResponse,
  dialLeadFromActiveCall,
  isStaleSalesStatusCallback,
  sayInSpanish,
  validateTwilioRequestIfNeeded,
} from "../../../_cirugia360-speed-twilio.js";
import { tryNextAgent } from "../../../_cirugia360-speed-workflow.js";

const getLead = (request) => getSpeedLeadById(getFirstQueryValue(request.query?.leadId));

const getDecisionMessage = (retryResult) => {
  if (retryResult === "dispatched") {
    return "No recibimos confirmacion. Vamos a intentar con otra asesora.";
  }

  if (retryResult === "scheduled") {
    return "No recibimos confirmacion. Reprogramamos el intento automaticamente.";
  }

  return "No recibimos confirmacion. Finalizamos este intento.";
};

const getFinalAgentMessage = (dialStatus) => {
  switch (dialStatus) {
    case "completed":
      return "La llamada ha finalizado. Gracias.";
    case "busy":
      return "La paciente esta ocupada en este momento.";
    case "no-answer":
      return "La paciente no respondio la llamada.";
    case "failed":
      return "No pudimos completar la llamada con la paciente.";
    case "canceled":
      return "La llamada con la paciente fue cancelada.";
    default:
      return "La llamada ha finalizado.";
  }
};

const handleSalesIntro = async (request, response, form) => {
  const config = await getCirugia360SpeedConfigWithSettings(request, {
    requireTwilio: true,
  });

  if (!validateTwilioRequestIfNeeded(request, config, form)) {
    return sendJson(response, 403, {
      success: false,
      error: "Firma de Twilio invalida.",
    });
  }

  const lead = await getLead(request);
  const voiceResponse = createVoiceResponse();

  if (!lead) {
    sayInSpanish(voiceResponse, "No pudimos recuperar este lead. Finalizando llamada.");
    voiceResponse.hangup();
    return sendXml(response, voiceResponse.toString());
  }

  if (isStaleSalesStatusCallback(lead, form.CallSid || null)) {
    voiceResponse.hangup();
    return sendXml(response, voiceResponse.toString());
  }

  const summaryText = buildLeadSummaryText(lead);

  await updateSpeedLead(lead.id, {
    status: "waiting_agent_confirmation",
    sales_call_status: "prompting",
    summary_text: summaryText,
  });
  await insertSpeedLeadEvent(lead.id, "sales_call.prompting", {
    callSid: form.CallSid || null,
  });

  const gather = voiceResponse.gather({
    numDigits: 1,
    input: ["dtmf"],
    timeout: 7,
    action: `${config.appUrl}/api/cirugia360-speed/twilio/voice/sales-decision?leadId=${encodeURIComponent(
      lead.id,
    )}`,
    method: "POST",
    actionOnEmptyResult: true,
  });

  sayInSpanish(gather, summaryText);
  return sendXml(response, voiceResponse.toString());
};

const handleSalesDecision = async (request, response, form) => {
  const config = await getCirugia360SpeedConfigWithSettings(request, {
    requireTwilio: true,
  });

  if (!validateTwilioRequestIfNeeded(request, config, form)) {
    return sendJson(response, 403, {
      success: false,
      error: "Firma de Twilio invalida.",
    });
  }

  const lead = await getLead(request);
  const voiceResponse = createVoiceResponse();

  if (!lead) {
    sayInSpanish(voiceResponse, "No encontramos este lead. Finalizando llamada.");
    voiceResponse.hangup();
    return sendXml(response, voiceResponse.toString());
  }

  if (isStaleSalesStatusCallback(lead, form.CallSid || null)) {
    voiceResponse.hangup();
    return sendXml(response, voiceResponse.toString());
  }

  const digits = String(form.Digits || "").trim();

  await insertSpeedLeadEvent(lead.id, "sales_call.decision", {
    digits: digits || null,
    callSid: form.CallSid || null,
  });

  if (digits === "1") {
    const conversationId = randomUUID();

    await updateSpeedLead(lead.id, {
      status: "connecting_customer",
      sales_call_status: "accepted",
      last_error: null,
    });
    await insertSpeedLeadEvent(lead.id, "conversation.started", {
      conversationId,
      salesCallSid: form.CallSid || lead.twilio_sales_call_sid || null,
      agent: lead.assigned_agent_name,
    });

    sayInSpanish(voiceResponse, "Perfecto. Te conecto con la paciente ahora mismo.");
    dialLeadFromActiveCall(voiceResponse, config, lead, conversationId);
    return sendXml(response, voiceResponse.toString());
  }

  let retryResult = "exhausted";

  if (canRetryAgent(lead)) {
    retryResult = await tryNextAgent(lead, config, "La asesora no confirmo con 1.");
  }

  sayInSpanish(voiceResponse, getDecisionMessage(retryResult));
  voiceResponse.hangup();
  return sendXml(response, voiceResponse.toString());
};

const handleCustomerComplete = async (request, response, form) => {
  const config = await getCirugia360SpeedConfigWithSettings(request, {
    requireTwilio: true,
  });

  if (!validateTwilioRequestIfNeeded(request, config, form)) {
    return sendJson(response, 403, {
      success: false,
      error: "Firma de Twilio invalida.",
    });
  }

  const lead = await getLead(request);
  const voiceResponse = createVoiceResponse();

  if (!lead) {
    sayInSpanish(voiceResponse, "La llamada ha finalizado.");
    voiceResponse.hangup();
    return sendXml(response, voiceResponse.toString());
  }

  const dialStatus = form.DialCallStatus || "completed";
  const customerCallSid = form.DialCallSid || lead.twilio_customer_call_sid || null;
  const nextStatus = dialStatus === "completed" ? "completed" : "customer_unreachable";

  await updateSpeedLead(lead.id, {
    status: nextStatus,
    customer_call_status: dialStatus,
    twilio_customer_call_sid: customerCallSid,
    completed_at: lead.completed_at || new Date().toISOString(),
    last_error: dialStatus === "completed" ? null : `Cliente ${dialStatus}`,
  });
  await insertSpeedLeadEvent(lead.id, "customer_call.completed", {
    conversationId: getFirstQueryValue(request.query?.conversationId) || null,
    callSid: customerCallSid,
    dialStatus,
  });

  sayInSpanish(voiceResponse, getFinalAgentMessage(dialStatus));
  voiceResponse.hangup();
  return sendXml(response, voiceResponse.toString());
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return methodNotAllowed(response, ["POST"]);
  }

  const action = getFirstQueryValue(request.query?.action);

  try {
    const form = await readFormBody(request);

    switch (action) {
      case "sales-intro":
        return handleSalesIntro(request, response, form);
      case "sales-decision":
        return handleSalesDecision(request, response, form);
      case "customer-complete":
        return handleCustomerComplete(request, response, form);
      default:
        return sendJson(response, 404, {
          success: false,
          error: "Accion de Twilio Voice no soportada.",
        });
    }
  } catch (error) {
    const voiceResponse = createVoiceResponse();
    sayInSpanish(
      voiceResponse,
      "Tuvimos un problema tecnico al procesar esta llamada. Vamos a finalizar este intento.",
    );
    voiceResponse.hangup();
    return sendXml(response, voiceResponse.toString());
  }
}

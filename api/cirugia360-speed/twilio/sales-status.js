import { getCirugia360SpeedConfigWithSettings } from "../../_cirugia360-speed-config.js";
import {
  getFirstQueryValue,
  methodNotAllowed,
  normalizeText,
  readFormBody,
  sendJson,
} from "../../_cirugia360-speed-shared.js";
import {
  getLeadBySalesCallSid,
  getSpeedLeadById,
  insertSpeedLeadEvent,
  updateSpeedLead,
} from "../../_cirugia360-speed-db.js";
import { updateRuntimeAgentStatus } from "../../_cirugia360-speed-settings.js";
import {
  canRetryAgent,
  isStaleSalesStatusCallback,
  validateTwilioRequestIfNeeded,
} from "../../_cirugia360-speed-twilio.js";
import { tryNextAgent } from "../../_cirugia360-speed-workflow.js";

const FAILURE_STATUSES = new Set(["busy", "failed", "no-answer", "canceled"]);
const AGENT_ANSWERED_STATUSES = new Set(["answered", "in-progress", "prompting", "accepted"]);

const getTwilioErrorDetail = (form) =>
  [
    form.ErrorCode ? `Twilio ${normalizeText(form.ErrorCode)}` : null,
    normalizeText(form.ErrorMessage),
  ]
    .filter(Boolean)
    .join(": ");

const getLeadFromRequest = async (request, callSid) => {
  const leadId = getFirstQueryValue(request.query?.leadId);

  if (leadId) {
    return getSpeedLeadById(leadId);
  }

  if (callSid) {
    return getLeadBySalesCallSid(callSid);
  }

  return null;
};

const getFailureMessage = (callStatus, form = {}) => {
  const errorDetail = getTwilioErrorDetail(form);
  const suffix = errorDetail ? ` ${errorDetail}.` : "";

  switch (callStatus) {
    case "busy":
      return `La llamada a la asesora devolvio ocupado.${suffix}`;
    case "failed":
      return `No pudimos completar la llamada saliente a la asesora.${suffix}`;
    case "no-answer":
      return `La asesora no contesto la llamada.${suffix}`;
    case "canceled":
      return `La llamada a la asesora fue cancelada.${suffix}`;
    default:
      return `La llamada a la asesora termino en estado ${callStatus}.${suffix}`;
  }
};

export const didSalesCallReachAgent = (lead) =>
  AGENT_ANSWERED_STATUSES.has(normalizeText(lead?.sales_call_status));

export const shouldAutoDeactivateAgentForSalesStatus = (lead, callStatus) => {
  const normalizedStatus = normalizeText(callStatus);
  const salesCallReachedAgent = didSalesCallReachAgent(lead);

  if (normalizedStatus === "completed") {
    return salesCallReachedAgent;
  }

  if (normalizedStatus === "no-answer") {
    return true;
  }

  if (["busy", "failed", "canceled"].includes(normalizedStatus)) {
    return salesCallReachedAgent;
  }

  return false;
};

const getCompletedFallbackReason = (lead) => {
  if (
    !["dialing_agent", "waiting_agent_confirmation"].includes(lead.status) ||
    lead.customer_call_status ||
    lead.customer_connected_at ||
    lead.twilio_customer_call_sid ||
    lead.completed_at
  ) {
    return null;
  }

  if (lead.sales_call_status === "prompting") {
    return "La asesora no confirmo con 1.";
  }

  return "La asesora no atendio la llamada.";
};

const deactivateAssignedAgent = async (lead, config, reason) => {
  const result = await updateRuntimeAgentStatus({
    agentEmail: lead.assigned_agent_email,
    active: false,
    reason,
    lead,
    defaultCountryDialCode: config.defaultCountryDialCode,
    updatedBy: "twilio",
  });

  if (result.agent) {
    await insertSpeedLeadEvent(lead.id, "agent.auto_deactivated", {
      agentId: result.agent.id,
      agentName: result.agent.name,
      agentEmail: result.agent.email,
      reason,
      at: result.agent.lastAutoDeactivation?.at || new Date().toISOString(),
    });
  }

  return result.agent;
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return methodNotAllowed(response, ["POST"]);
  }

  try {
    const form = await readFormBody(request);
    const config = await getCirugia360SpeedConfigWithSettings(request, {
      requireTwilio: true,
    });

    if (!validateTwilioRequestIfNeeded(request, config, form)) {
      return sendJson(response, 403, {
        success: false,
        error: "Firma de Twilio invalida.",
      });
    }

    const callSid = form.CallSid || "";
    const callStatus = form.CallStatus || "unknown";
    const lead = await getLeadFromRequest(request, callSid);

    if (!lead) {
      return sendJson(response, 200, {
        success: true,
        ignored: true,
      });
    }

    if (isStaleSalesStatusCallback(lead, callSid)) {
      return sendJson(response, 200, {
        success: true,
        stale: true,
      });
    }

    await insertSpeedLeadEvent(lead.id, "sales_call.status", {
      callSid,
      callStatus,
      from: normalizeText(form.From) || null,
      to: normalizeText(form.To) || null,
      errorCode: normalizeText(form.ErrorCode) || null,
      errorMessage: normalizeText(form.ErrorMessage) || null,
    });

    if (["initiated", "ringing"].includes(callStatus)) {
      await updateSpeedLead(lead.id, {
        status: "dialing_agent",
        sales_call_status: callStatus,
        last_error: null,
      });

      return sendJson(response, 200, { success: true });
    }

    if (["answered", "in-progress"].includes(callStatus)) {
      await updateSpeedLead(lead.id, {
        status: "waiting_agent_confirmation",
        sales_call_status: callStatus,
        last_error: null,
      });

      return sendJson(response, 200, { success: true });
    }

    if (callStatus === "completed") {
      const fallbackReason = getCompletedFallbackReason(lead);

      if (fallbackReason && shouldAutoDeactivateAgentForSalesStatus(lead, callStatus)) {
        await deactivateAssignedAgent(lead, config, fallbackReason);
      }

      if (fallbackReason && canRetryAgent(lead)) {
        const retryResult = await tryNextAgent(lead, config, fallbackReason);

        return sendJson(response, 200, {
          success: true,
          retried: retryResult === "dispatched",
          scheduled: retryResult === "scheduled",
          exhausted: retryResult === "exhausted",
        });
      }

      if (fallbackReason) {
        await updateSpeedLead(lead.id, {
          status: "agent_unreachable",
          sales_call_status: "completed",
          last_error: fallbackReason,
        });

        return sendJson(response, 200, { success: true });
      }
    }

    if (FAILURE_STATUSES.has(callStatus)) {
      const failureMessage = getFailureMessage(callStatus, form);

      if (shouldAutoDeactivateAgentForSalesStatus(lead, callStatus)) {
        await deactivateAssignedAgent(lead, config, failureMessage);
      }
    }

    if (FAILURE_STATUSES.has(callStatus) && canRetryAgent(lead)) {
      const failureMessage = getFailureMessage(callStatus, form);
      const retryResult = await tryNextAgent(lead, config, failureMessage);

      return sendJson(response, 200, {
        success: true,
        retried: retryResult === "dispatched",
        scheduled: retryResult === "scheduled",
        exhausted: retryResult === "exhausted",
      });
    }

    if (FAILURE_STATUSES.has(callStatus)) {
      await updateSpeedLead(lead.id, {
        status: "agent_unreachable",
        sales_call_status: callStatus,
        last_error: getFailureMessage(callStatus, form),
      });

      return sendJson(response, 200, { success: true });
    }

    await updateSpeedLead(lead.id, {
      sales_call_status: callStatus,
    });

    return sendJson(response, 200, {
      success: true,
    });
  } catch (error) {
    return sendJson(response, 500, {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo procesar el callback de Twilio.",
    });
  }
}

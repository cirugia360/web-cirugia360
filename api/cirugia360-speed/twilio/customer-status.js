import { getCirugia360SpeedConfigWithSettings } from "../../_cirugia360-speed-config.js";
import {
  getFirstQueryValue,
  methodNotAllowed,
  readFormBody,
  sendJson,
} from "../../_cirugia360-speed-shared.js";
import {
  getLeadByCustomerCallSid,
  getSpeedLeadById,
  insertSpeedLeadEvent,
  updateSpeedLead,
} from "../../_cirugia360-speed-db.js";
import {
  isStaleCustomerStatusCallback,
  validateTwilioRequestIfNeeded,
} from "../../_cirugia360-speed-twilio.js";

const CONTACTED_STATUSES = new Set(["answered", "in-progress", "completed"]);
const FAILED_STATUSES = new Set(["busy", "failed", "no-answer", "canceled"]);

const getLeadFromRequest = async (request, callSid) => {
  const leadId = getFirstQueryValue(request.query?.leadId);

  if (leadId) {
    return getSpeedLeadById(leadId);
  }

  if (callSid) {
    return getLeadByCustomerCallSid(callSid);
  }

  return null;
};

const getStatusFromCustomerCall = (callStatus) => {
  if (["answered", "in-progress"].includes(callStatus)) {
    return "customer_connected";
  }

  if (FAILED_STATUSES.has(callStatus)) {
    return "customer_unreachable";
  }

  if (callStatus === "completed") {
    return "completed";
  }

  return null;
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return methodNotAllowed(response, ["POST"]);
  }

  try {
    const form = await readFormBody(request);
    const config = await getCirugia360SpeedConfigWithSettings(request, {
      requireAgents: false,
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

    if (isStaleCustomerStatusCallback(lead, callSid)) {
      return sendJson(response, 200, {
        success: true,
        stale: true,
      });
    }

    const nextStatus = getStatusFromCustomerCall(callStatus) || lead.status;
    const customerConnectedAt =
      CONTACTED_STATUSES.has(callStatus) && !lead.customer_connected_at
        ? new Date().toISOString()
        : lead.customer_connected_at;
    const completedAt =
      (callStatus === "completed" || FAILED_STATUSES.has(callStatus)) && !lead.completed_at
        ? new Date().toISOString()
        : lead.completed_at;

    await insertSpeedLeadEvent(lead.id, "customer_call.status", {
      callSid,
      callStatus,
      conversationId: getFirstQueryValue(request.query?.conversationId) || null,
    });

    await updateSpeedLead(lead.id, {
      twilio_customer_call_sid: callSid || lead.twilio_customer_call_sid,
      customer_call_status: callStatus,
      status: nextStatus,
      customer_connected_at: customerConnectedAt,
      completed_at: completedAt,
      last_error:
        CONTACTED_STATUSES.has(callStatus) || callStatus === "completed"
          ? null
          : `Cliente ${callStatus}`,
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
          : "No se pudo procesar el estado de la llamada al paciente.",
    });
  }
}

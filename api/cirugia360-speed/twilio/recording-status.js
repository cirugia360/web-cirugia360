import { getCirugia360SpeedConfigWithSettings } from "../../_cirugia360-speed-config.js";
import {
  getFirstQueryValue,
  methodNotAllowed,
  readFormBody,
  sendJson,
} from "../../_cirugia360-speed-shared.js";
import {
  getSpeedLeadById,
  insertSpeedLeadEvent,
  updateSpeedLead,
} from "../../_cirugia360-speed-db.js";
import { validateTwilioRequestIfNeeded } from "../../_cirugia360-speed-twilio.js";

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

    const leadId = getFirstQueryValue(request.query?.leadId);
    const lead = await getSpeedLeadById(leadId);

    if (!lead) {
      return sendJson(response, 200, {
        success: true,
        ignored: true,
      });
    }

    const recordingSid = form.RecordingSid || "";
    const recordingUrl = form.RecordingUrl || "";
    const recordingStatus = form.RecordingStatus || "";
    const recordingDuration = Number.parseInt(String(form.RecordingDuration || ""), 10);

    await updateSpeedLead(lead.id, {
      recording_sid: recordingSid || lead.recording_sid,
      recording_url: recordingUrl || lead.recording_url,
      recording_status: recordingStatus || lead.recording_status,
      recording_duration: Number.isFinite(recordingDuration)
        ? recordingDuration
        : lead.recording_duration,
    });
    await insertSpeedLeadEvent(lead.id, "recording.status", {
      recordingSid,
      recordingUrl,
      recordingStatus,
      recordingDuration: Number.isFinite(recordingDuration) ? recordingDuration : null,
      conversationId: getFirstQueryValue(request.query?.conversationId) || null,
    });

    return sendJson(response, 200, { success: true });
  } catch (error) {
    return sendJson(response, 500, {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el estado de la grabacion.",
    });
  }
}

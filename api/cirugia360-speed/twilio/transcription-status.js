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

    const transcriptionSid = form.TranscriptionSid || "";
    const transcriptionText = form.TranscriptionText || "";
    const transcriptionStatus = form.TranscriptionStatus || "";

    await updateSpeedLead(lead.id, {
      transcription_sid: transcriptionSid || lead.transcription_sid,
      transcription_text: transcriptionText || lead.transcription_text,
      transcription_status: transcriptionStatus || lead.transcription_status,
    });
    await insertSpeedLeadEvent(lead.id, "transcription.status", {
      transcriptionSid,
      transcriptionStatus,
      hasText: Boolean(transcriptionText),
      conversationId: getFirstQueryValue(request.query?.conversationId) || null,
    });

    return sendJson(response, 200, { success: true });
  } catch (error) {
    return sendJson(response, 500, {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la transcripcion.",
    });
  }
}

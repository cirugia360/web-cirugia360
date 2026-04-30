import { getCirugia360SpeedConfigWithSettings } from "../../_cirugia360-speed-config.js";
import {
  getFirstQueryValue,
  normalizeText,
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

const MAX_TRANSCRIPTION_SEGMENTS = 500;

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const parseJsonObject = (value) => {
  if (isObject(value)) {
    return value;
  }

  const rawValue = normalizeText(value);

  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const parseNumberOrNull = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const isTruthyString = (value) => normalizeText(value).toLowerCase() === "true";

const getExistingSegments = (lead) => {
  const fromColumn = Array.isArray(lead?.transcription_segments)
    ? lead.transcription_segments
    : null;
  const fromMetadata = Array.isArray(lead?.metadata?.transcriptionSegments)
    ? lead.metadata.transcriptionSegments
    : [];

  return (fromColumn || fromMetadata)
    .filter(isObject)
    .map((segment) => ({
      id: normalizeText(segment.id),
      speaker: normalizeText(segment.speaker) || "unknown",
      label: normalizeText(segment.label) || "Sin identificar",
      track: normalizeText(segment.track) || null,
      text: normalizeText(segment.text),
      timestamp: normalizeText(segment.timestamp) || null,
      sequenceId: parseNumberOrNull(segment.sequenceId),
      confidence: parseNumberOrNull(segment.confidence),
      final: segment.final !== false,
      transcriptionSid: normalizeText(segment.transcriptionSid) || null,
    }))
    .filter((segment) => segment.id && segment.text);
};

const getSpeakerFromTrack = (track) => {
  if (track === "inbound_track") {
    return { speaker: "agent", label: "Agente" };
  }

  if (track === "outbound_track") {
    return { speaker: "customer", label: "Cliente" };
  }

  return { speaker: "unknown", label: "Sin identificar" };
};

const buildTranscriptText = (segments, fallbackText = "") => {
  if (!segments.length) {
    return normalizeText(fallbackText);
  }

  return segments.map((segment) => `${segment.label}: ${segment.text}`).join("\n");
};

const buildRealtimeSegment = (form) => {
  const hasRealtimeShape =
    normalizeText(form.TranscriptionData) ||
    normalizeText(form.Track) ||
    normalizeText(form.TranscriptionEvent) === "transcription-content";

  if (!hasRealtimeShape) {
    return null;
  }

  const transcriptionData = parseJsonObject(form.TranscriptionData);
  const transcriptText = normalizeText(transcriptionData.transcript || form.TranscriptionText);
  const finalValue = normalizeText(form.Final);
  const isFinal = finalValue ? isTruthyString(finalValue) : true;

  if (!transcriptText || !isFinal) {
    return null;
  }

  const track = normalizeText(form.Track);
  const { speaker, label } = getSpeakerFromTrack(track);
  const transcriptionSid = normalizeText(form.TranscriptionSid) || null;
  const sequenceId = parseNumberOrNull(form.SequenceId);
  const timestamp = normalizeText(form.Timestamp) || new Date().toISOString();
  const id = [
    transcriptionSid || "transcription",
    sequenceId ?? timestamp,
    track || "track",
  ].join(":");

  return {
    id,
    speaker,
    label,
    track: track || null,
    text: transcriptText,
    timestamp,
    sequenceId,
    confidence: parseNumberOrNull(transcriptionData.confidence),
    final: true,
    transcriptionSid,
  };
};

const appendSegment = (segments, nextSegment) => {
  if (!nextSegment) {
    return segments;
  }

  const byId = new Map(segments.map((segment) => [segment.id, segment]));
  byId.set(nextSegment.id, nextSegment);

  return Array.from(byId.values())
    .sort((firstSegment, secondSegment) => {
      const firstSequence = firstSegment.sequenceId ?? Number.MAX_SAFE_INTEGER;
      const secondSequence = secondSegment.sequenceId ?? Number.MAX_SAFE_INTEGER;

      if (firstSequence !== secondSequence) {
        return firstSequence - secondSequence;
      }

      return (
        Date.parse(firstSegment.timestamp || "") -
        Date.parse(secondSegment.timestamp || "")
      );
    })
    .slice(-MAX_TRANSCRIPTION_SEGMENTS);
};

const hasMissingSegmentsColumnError = (error) =>
  normalizeText(error?.message || error)
    .toLowerCase()
    .includes("transcription_segments");

const buildTranscriptionMetadata = ({ lead, segments, form, eventType, conversationId }) => {
  const currentMetadata = isObject(lead.metadata) ? lead.metadata : {};
  const currentTranscription = isObject(currentMetadata.transcription)
    ? currentMetadata.transcription
    : {};

  return {
    ...currentMetadata,
    transcription: {
      ...currentTranscription,
      sid: normalizeText(form.TranscriptionSid) || currentTranscription.sid || null,
      eventType,
      status:
        normalizeText(form.TranscriptionStatus) ||
        (eventType === "transcription-error"
          ? "failed"
          : eventType === "transcription-stopped"
            ? "completed"
            : "in-progress"),
      conversationId: conversationId || currentTranscription.conversationId || null,
      updatedAt: new Date().toISOString(),
    },
    transcriptionSegments: segments,
  };
};

const updateLeadTranscription = async ({ lead, updates, segments, form, eventType, conversationId }) => {
  const metadata = buildTranscriptionMetadata({
    lead,
    segments,
    form,
    eventType,
    conversationId,
  });
  const payload = {
    ...updates,
    transcription_segments: segments,
    metadata,
  };

  try {
    return await updateSpeedLead(lead.id, payload);
  } catch (error) {
    if (!hasMissingSegmentsColumnError(error)) {
      throw error;
    }

    const fallbackPayload = { ...updates, metadata };
    delete fallbackPayload.transcription_segments;
    return updateSpeedLead(lead.id, fallbackPayload);
  }
};

export const buildTranscriptionUpdate = (lead, form) => {
  const eventType =
    normalizeText(form.TranscriptionEvent) ||
    normalizeText(form.TranscriptionStatus) ||
    (normalizeText(form.TranscriptionText) ? "legacy-transcription" : "unknown");
  const existingSegments = getExistingSegments(lead);
  const nextSegment = buildRealtimeSegment(form);
  const segments = appendSegment(existingSegments, nextSegment);
  const legacyTranscriptionText = normalizeText(form.TranscriptionText);
  const transcriptionText = buildTranscriptText(
    segments,
    legacyTranscriptionText || lead.transcription_text || "",
  );
  const transcriptionStatus =
    normalizeText(form.TranscriptionStatus) ||
    (eventType === "transcription-error"
      ? "failed"
      : eventType === "transcription-stopped"
        ? "completed"
        : eventType === "legacy-transcription"
          ? "completed"
          : "in-progress");

  return {
    eventType,
    segments,
    nextSegment,
    updates: {
      transcription_sid: normalizeText(form.TranscriptionSid) || lead.transcription_sid,
      transcription_text: transcriptionText || lead.transcription_text,
      transcription_status: transcriptionStatus || lead.transcription_status,
    },
  };
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

    const leadId = getFirstQueryValue(request.query?.leadId);
    const lead = await getSpeedLeadById(leadId);

    if (!lead) {
      return sendJson(response, 200, {
        success: true,
        ignored: true,
      });
    }

    const conversationId = getFirstQueryValue(request.query?.conversationId) || null;
    const { eventType, segments, nextSegment, updates } = buildTranscriptionUpdate(lead, form);

    await updateLeadTranscription({
      lead,
      updates,
      segments,
      form,
      eventType,
      conversationId,
    });
    await insertSpeedLeadEvent(lead.id, "transcription.status", {
      eventType,
      transcriptionSid: normalizeText(form.TranscriptionSid) || null,
      transcriptionStatus: updates.transcription_status,
      track: normalizeText(form.Track) || null,
      speaker: nextSegment?.speaker || null,
      segment: nextSegment || null,
      hasText: Boolean(nextSegment?.text || normalizeText(form.TranscriptionText)),
      conversationId,
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

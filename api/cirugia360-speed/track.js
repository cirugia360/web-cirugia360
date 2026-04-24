import { z, ZodError } from "zod";
import {
  dispatchMetaEvent,
  insertTrackingEvent,
} from "../_cirugia360-dashboard-data.js";
import { getSpeedLeadById } from "../_cirugia360-speed-db.js";
import {
  getHeader,
  methodNotAllowed,
  normalizeText,
  readJsonBody,
  sendJson,
} from "../_cirugia360-speed-shared.js";

const trackingSchema = z.object({
  event: z.string().trim().min(1),
  leadId: z.string().uuid().optional().nullable(),
  sourceUrl: z.string().trim().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const getClientIp = (request) =>
  normalizeText(getHeader(request, "x-forwarded-for")).split(",")[0]?.trim() ||
  normalizeText(request.socket?.remoteAddress);

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return methodNotAllowed(response, ["POST"]);
  }

  try {
    const payload = trackingSchema.parse(await readJsonBody(request));
    const lead = payload.leadId ? await getSpeedLeadById(payload.leadId) : null;
    const requestContext = {
      clientIp: getClientIp(request),
      clientUserAgent: getHeader(request, "user-agent"),
      sourceUrl: normalizeText(payload.sourceUrl),
    };
    const meta = await dispatchMetaEvent({
      lead,
      eventName: payload.event,
      requestContext,
    });
    const trackingEvent = await insertTrackingEvent({
      leadId: lead?.id || null,
      eventName: payload.event,
      eventSource: "browser",
      sourceUrl: requestContext.sourceUrl,
      clientIp: requestContext.clientIp,
      clientUserAgent: requestContext.clientUserAgent,
      metadata: payload.metadata || {},
      metaEventId: meta.eventId,
      metaResponse: meta.response,
      metaSuccess: meta.skipped ? null : meta.success,
    });

    return sendJson(response, 200, {
      success: true,
      data: {
        id: trackingEvent.id,
        meta: {
          skipped: meta.skipped,
          success: meta.success,
        },
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof ZodError || error instanceof SyntaxError ? 400 : 500;

    return sendJson(response, statusCode, {
      success: false,
      error: error instanceof Error ? error.message : "No pudimos registrar el evento.",
    });
  }
}

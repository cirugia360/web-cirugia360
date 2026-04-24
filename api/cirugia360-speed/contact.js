import { ZodError, z } from "zod";
import { getCirugia360SpeedConfig } from "../_cirugia360-speed-config.js";
import { methodNotAllowed, readJsonBody, sendJson } from "../_cirugia360-speed-shared.js";
import { createContactLead } from "../_cirugia360-speed-workflow.js";

const contactSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  email: z.string().trim().email().optional().nullable(),
  procedure: z.string().trim().optional().nullable(),
  message: z.string().trim().optional().nullable(),
  sourceUrl: z.string().trim().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const normalizePayload = (payload) => ({
  fullName: payload.fullName || payload.nombre || "",
  phone: payload.phone || payload.telefono || "",
  email: payload.email || payload.correo || null,
  procedure: payload.procedure || payload.procedimiento || null,
  message: payload.message || payload.mensaje || null,
  sourceUrl: payload.sourceUrl || payload.url || payload.pagina || null,
  metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
  website: payload.website || "",
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return methodNotAllowed(response, ["POST"]);
  }

  try {
    const rawPayload = normalizePayload(await readJsonBody(request));

    if (String(rawPayload.website || "").trim()) {
      return sendJson(response, 200, {
        success: true,
        ignored: true,
      });
    }

    const payload = contactSchema.parse(rawPayload);
    const config = getCirugia360SpeedConfig(request, {
      requireTwilio: true,
    });
    const result = await createContactLead(payload, config);

    return sendJson(response, 200, {
      success: true,
      leadId: result.lead.id,
      callStarted: result.callStarted,
      queued: result.queued,
      dispatchScheduledAt: result.dispatchScheduledAt,
      assignedAgent: result.lead.assigned_agent_name,
      warning: result.warning,
    });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return sendJson(response, 400, {
        success: false,
        error: "Completa correctamente los campos requeridos para el contacto.",
      });
    }

    return sendJson(response, 500, {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo crear el lead.",
    });
  }
}

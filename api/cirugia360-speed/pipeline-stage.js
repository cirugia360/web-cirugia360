import { z, ZodError } from "zod";
import { canAccessLead, requireDashboardAuth, sendForbiddenLead } from "../_cirugia360-dashboard-auth.js";
import {
  updatePipelineOutcome,
  updatePipelineStage,
  updatePipelineValue,
} from "../_cirugia360-dashboard-data.js";
import { getSpeedLeadById } from "../_cirugia360-speed-db.js";
import { methodNotAllowed, readJsonBody, sendJson } from "../_cirugia360-speed-shared.js";

const stageSchema = z.object({
  action: z.literal("stage"),
  leadId: z.string().uuid(),
  stage: z.enum([
    "nuevo",
    "contactado",
    "contacto_whatsapp",
    "esperando_pago",
    "eval_presencial",
    "eval_online",
    "presupuesto",
    "examenes",
    "cirugia",
  ]),
  at: z.string().datetime().optional(),
});

const valueSchema = z.object({
  action: z.literal("value"),
  leadId: z.string().uuid(),
  pipelineValue: z.number().finite().nonnegative(),
  at: z.string().datetime().optional(),
});

const outcomeSchema = z.object({
  action: z.literal("outcome"),
  leadId: z.string().uuid(),
  outcome: z.enum(["active", "lost", "won"]),
  reasonCode: z
    .enum(["no_responde", "precio", "no_califica_medicamente", "eligio_otra_clinica", "otro"])
    .optional()
    .nullable(),
  reason: z.string().trim().max(500).optional().nullable(),
  at: z.string().datetime().optional(),
});

const parsePayload = (payload) => {
  if (payload?.action === "stage") {
    return stageSchema.parse(payload);
  }

  if (payload?.action === "value") {
    return valueSchema.parse(payload);
  }

  if (payload?.action === "outcome") {
    return outcomeSchema.parse(payload);
  }

  throw new Error("Accion de pipeline no valida.");
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return methodNotAllowed(response, ["POST"]);
  }

  const user = await requireDashboardAuth(request, response);

  if (!user) {
    return;
  }

  try {
    const payload = parsePayload(await readJsonBody(request));
    const currentLead = await getSpeedLeadById(payload.leadId);

    if (!currentLead) {
      return sendJson(response, 404, {
        success: false,
        error: "No encontramos ese lead.",
      });
    }

    if (!canAccessLead(user, currentLead)) {
      return sendForbiddenLead(response);
    }

    let lead = null;

    if (payload.action === "stage") {
      lead = await updatePipelineStage(payload);
    } else if (payload.action === "value") {
      lead = await updatePipelineValue(payload);
    } else {
      if (payload.outcome === "lost" && !payload.reasonCode) {
        return sendJson(response, 400, {
          success: false,
          error: "Selecciona el motivo de perdida.",
        });
      }

      lead = await updatePipelineOutcome(payload);
    }

    if (!lead) {
      return sendJson(response, 404, {
        success: false,
        error: "No encontramos ese lead.",
      });
    }

    return sendJson(response, 200, {
      success: true,
      leadId: lead.id,
    });
  } catch (error) {
    const statusCode =
      error instanceof ZodError || error instanceof SyntaxError ? 400 : 500;

    return sendJson(response, statusCode, {
      success: false,
      error: error instanceof Error ? error.message : "No pudimos actualizar el pipeline.",
    });
  }
}

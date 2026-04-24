import { z, ZodError } from "zod";
import { requireDashboardAuth } from "../_cirugia360-dashboard-auth.js";
import { toPublicLead } from "../_cirugia360-dashboard-data.js";
import { getCirugia360SpeedConfigWithSettings } from "../_cirugia360-speed-config.js";
import { getSpeedLeadById, insertSpeedLead, insertSpeedLeadEvent, updateSpeedLead } from "../_cirugia360-speed-db.js";
import { buildLeadSummaryText } from "../_cirugia360-speed-twilio.js";
import {
  methodNotAllowed,
  normalizePhoneInput,
  normalizeText,
  readJsonBody,
  sendJson,
} from "../_cirugia360-speed-shared.js";

const createLeadSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  procedureInterest: z.string().trim().optional().nullable(),
  assignedAgentId: z.string().trim().optional().nullable(),
  pipelineValue: z.number().finite().nonnegative().optional().default(0),
});

const updateLeadSchema = z.object({
  leadId: z.string().uuid(),
  assignedAgentId: z.string().trim().optional().nullable(),
});

const findAssignedAgent = (agents, assignedAgentId) => {
  const normalizedId = normalizeText(assignedAgentId);

  if (!normalizedId) {
    return null;
  }

  return (
    agents.find((agent) => agent.id === normalizedId || agent.name === normalizedId || agent.phone === normalizedId) ||
    null
  );
};

export default async function handler(request, response) {
  if (!["POST", "PATCH"].includes(request.method || "")) {
    return methodNotAllowed(response, ["POST", "PATCH"]);
  }

  const user = await requireDashboardAuth(request, response);

  if (!user) {
    return;
  }

  try {
    if (request.method === "PATCH") {
      const payload = updateLeadSchema.parse(await readJsonBody(request));
      const lead = await getSpeedLeadById(payload.leadId);

      if (!lead) {
        return sendJson(response, 404, {
          success: false,
          error: "No encontramos ese lead.",
        });
      }

      const config = await getCirugia360SpeedConfigWithSettings(request, {
        requireAgents: false,
        requireTwilio: false,
      });
      const assignedAgent = findAssignedAgent(config.salesAgents || [], payload.assignedAgentId);
      const updatedLead = await updateSpeedLead(lead.id, {
        assigned_agent_name: assignedAgent?.name || null,
        assigned_agent_phone: assignedAgent?.phone || null,
        assigned_agent_email: assignedAgent?.email || null,
      });

      await insertSpeedLeadEvent(lead.id, "lead.assigned_agent_changed", {
        previousAgentName: lead.assigned_agent_name || null,
        assignedAgentName: assignedAgent?.name || null,
        changedBy: user.email || null,
      });

      return sendJson(response, 200, {
        success: true,
        data: toPublicLead(updatedLead, []),
      });
    }

    const payload = createLeadSchema.parse(await readJsonBody(request));
    const config = await getCirugia360SpeedConfigWithSettings(request, {
      requireAgents: false,
      requireTwilio: false,
    });
    const assignedAgent = findAssignedAgent(config.salesAgents || [], payload.assignedAgentId);
    const procedureInterest = normalizeText(payload.procedureInterest) || "Evaluacion";
    const fullName = normalizeText(payload.fullName);
    const row = {
      lead_kind: "dashboard_manual",
      trigger_source: "dashboard_manual",
      status: "received",
      sales_call_status: null,
      customer_call_status: null,
      full_name: fullName,
      phone: normalizePhoneInput(payload.phone, config.defaultCountryDialCode),
      email: null,
      procedure_interest: procedureInterest,
      message: "Lead creado manualmente desde el dashboard.",
      summary_text: buildLeadSummaryText({
        lead_kind: "dashboard_manual",
        full_name: fullName,
        procedure_interest: procedureInterest,
        message: "Lead creado manualmente desde el dashboard.",
      }),
      source_url: null,
      payment_status: "not_required",
      payment_due_at: null,
      payment_confirmed_at: null,
      payment_reference: null,
      booking_reference: null,
      payment_url: null,
      external_reference_candidates: [],
      assigned_agent_name: assignedAgent?.name || null,
      assigned_agent_phone: assignedAgent?.phone || null,
      assigned_agent_email: assignedAgent?.email || null,
      agent_attempts: 0,
      dispatch_scheduled_at: null,
      first_attempt_at: null,
      customer_connected_at: null,
      completed_at: null,
      twilio_sales_call_sid: null,
      twilio_customer_call_sid: null,
      last_error: null,
      pipeline_stage: "nuevo",
      pipeline_outcome: null,
      pipeline_outcome_reason: null,
      pipeline_outcome_at: null,
      pipeline_value: Number(payload.pipelineValue || 0),
      metadata: {
        source: "dashboard",
        createdBy: user.email || null,
      },
    };

    const lead = await insertSpeedLead(row);

    await insertSpeedLeadEvent(lead.id, "lead.created", {
      source: "dashboard_manual",
      leadKind: lead.lead_kind,
      createdBy: user.email || null,
    });

    return sendJson(response, 200, {
      success: true,
      data: toPublicLead(lead, []),
    });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return sendJson(response, 400, {
        success: false,
        error: "Completa nombre, telefono y valor estimado correctamente.",
      });
    }

    return sendJson(response, 500, {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo crear el lead.",
    });
  }
}

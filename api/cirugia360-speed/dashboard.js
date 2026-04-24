import { requireDashboardAuth } from "../_cirugia360-dashboard-auth.js";
import {
  addLeadNote,
  buildDashboardSnapshot,
  deleteLeadNote,
  dispatchMetaEvent,
  insertTrackingEvent,
  restoreLeadNote,
  updateLeadNote,
} from "../_cirugia360-dashboard-data.js";
import {
  getCirugia360SpeedConfig,
  getCirugia360SpeedConfigWithSettings,
} from "../_cirugia360-speed-config.js";
import { getSpeedLeadById } from "../_cirugia360-speed-db.js";
import {
  buildSettingsFromConfig,
  loadSpeedRuntimeSettings,
  saveSpeedRuntimeSettings,
} from "../_cirugia360-speed-settings.js";
import {
  getFirstQueryValue,
  getHeader,
  methodNotAllowed,
  normalizeText,
  readJsonBody,
  sendJson,
} from "../_cirugia360-speed-shared.js";
import { triggerLeadPhoneCall } from "../_cirugia360-speed-workflow.js";

const noStore = (response) => {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  response.setHeader("CDN-Cache-Control", "no-store");
  response.setHeader("Vercel-CDN-Cache-Control", "no-store");
};

const getClientIp = (request) =>
  normalizeText(getHeader(request, "x-forwarded-for")).split(",")[0]?.trim() ||
  normalizeText(request.socket?.remoteAddress);

const handleGetSalesAgents = async (request, response) => {
  const baseConfig = getCirugia360SpeedConfig(request, {
    requireAgents: false,
    requireTwilio: false,
  });
  const settings = await loadSpeedRuntimeSettings(baseConfig.defaultCountryDialCode).catch(() => null);
  const mergedConfig = settings
    ? {
        ...baseConfig,
        dashboardSettings: settings,
      }
    : baseConfig;

  return sendJson(response, 200, {
    success: true,
    data: buildSettingsFromConfig(mergedConfig),
  });
};

const handleSaveSalesAgents = async (request, response, user) => {
  const baseConfig = getCirugia360SpeedConfig(request, {
    requireAgents: false,
    requireTwilio: false,
  });
  const body = await readJsonBody(request);
  const settings = await saveSpeedRuntimeSettings({
    settings: body,
    defaultCountryDialCode: baseConfig.defaultCountryDialCode,
    updatedBy: user.email,
  });

  return sendJson(response, 200, {
    success: true,
    data: settings,
  });
};

const handleQueueControl = async (request, response, user) => {
  const baseConfig = getCirugia360SpeedConfig(request, {
    requireAgents: false,
    requireTwilio: false,
  });
  const currentSettings = await loadSpeedRuntimeSettings(baseConfig.defaultCountryDialCode).catch(
    () => buildSettingsFromConfig(baseConfig),
  );
  const body = await readJsonBody(request);
  const action = normalizeText(body.action).toLowerCase();

  if (!["pause", "resume"].includes(action)) {
    return sendJson(response, 400, {
      success: false,
      error: "Indica si quieres pausar o reanudar la cola.",
    });
  }

  const settings = await saveSpeedRuntimeSettings({
    settings: {
      ...currentSettings,
      queuePaused: action === "pause",
    },
    defaultCountryDialCode: baseConfig.defaultCountryDialCode,
    updatedBy: user.email,
  });

  return sendJson(response, 200, {
    success: true,
    data: settings,
  });
};

const handleLeadNote = async (request, response, user) => {
  const body = await readJsonBody(request);
  const noteId = Number(body.noteId || 0);
  const leadId = normalizeText(body.leadId);
  const noteBody = normalizeText(body.body);
  const action = normalizeText(body.action).toLowerCase();

  if (request.method === "PATCH") {
    if (action === "restore") {
      if (!noteId) {
        return sendJson(response, 400, {
          success: false,
          error: "Selecciona una nota para restaurar.",
        });
      }

      const note = await restoreLeadNote({
        noteId,
        authorEmail: user.email,
      });

      if (!note) {
        return sendJson(response, 404, {
          success: false,
          error: "No encontramos esa nota.",
        });
      }

      return sendJson(response, 200, {
        success: true,
        data: note,
      });
    }

    if (!noteId || !noteBody) {
      return sendJson(response, 400, {
        success: false,
        error: "Selecciona una nota y escribe el texto actualizado.",
      });
    }

    const note = await updateLeadNote({
      noteId,
      body: noteBody,
      authorEmail: user.email,
    });

    if (!note) {
      return sendJson(response, 404, {
        success: false,
        error: "No encontramos esa nota.",
      });
    }

    return sendJson(response, 200, {
      success: true,
      data: note,
    });
  }

  if (request.method === "DELETE") {
    if (!noteId) {
      return sendJson(response, 400, {
        success: false,
        error: "Selecciona una nota para eliminar.",
      });
    }

    const note = await deleteLeadNote({
      noteId,
      authorEmail: user.email,
    });

    if (!note) {
      return sendJson(response, 404, {
        success: false,
        error: "No encontramos esa nota.",
      });
    }

    return sendJson(response, 200, {
      success: true,
      data: note,
    });
  }

  if (!leadId || !noteBody) {
    return sendJson(response, 400, {
      success: false,
      error: "Selecciona un lead y escribe una nota.",
    });
  }

  const note = await addLeadNote({
    leadId,
    body: noteBody,
    authorEmail: user.email,
  });

  if (!note) {
    return sendJson(response, 404, {
      success: false,
      error: "No encontramos ese lead.",
    });
  }

  return sendJson(response, 200, {
    success: true,
    data: note,
  });
};

const handleLeadCall = async (request, response) => {
  const body = await readJsonBody(request);
  const leadId = normalizeText(body.leadId);

  if (!leadId) {
    return sendJson(response, 400, {
      success: false,
      error: "Selecciona un lead para llamar.",
    });
  }

  const config = await getCirugia360SpeedConfigWithSettings(request, {
    requireAgents: true,
    requireTwilio: true,
  });
  const result = await triggerLeadPhoneCall(leadId, config, {
    reason: "Llamada manual solicitada desde dashboard.",
  });

  if (!result.found) {
    return sendJson(response, 404, {
      success: false,
      error: "No encontramos ese lead.",
    });
  }

  return sendJson(response, 200, {
    success: true,
    leadId: result.lead.id,
    callStarted: result.callStarted,
    queued: result.queued,
    dispatchScheduledAt: result.dispatchScheduledAt,
    assignedAgent: result.lead.assigned_agent_name,
    warning: result.warning,
  });
};

const handleTrack = async (request, response) => {
  const body = await readJsonBody(request);
  const leadId = normalizeText(body.leadId);
  const lead = leadId ? await getSpeedLeadById(leadId) : null;
  const eventName = normalizeText(body.eventName || body.event || "DashboardEvent");
  const requestContext = {
    clientIp: getClientIp(request),
    clientUserAgent: getHeader(request, "user-agent"),
    sourceUrl: normalizeText(body.sourceUrl),
  };
  const meta = await dispatchMetaEvent({
    lead,
    eventName,
    requestContext,
  });
  const trackingEvent = await insertTrackingEvent({
    leadId: lead?.id || null,
    eventName,
    eventSource: "dashboard",
    sourceUrl: requestContext.sourceUrl,
    clientIp: requestContext.clientIp,
    clientUserAgent: requestContext.clientUserAgent,
    metadata: body.metadata || {},
    metaEventId: meta.eventId,
    metaResponse: meta.response,
    metaSuccess: meta.skipped ? null : meta.success,
  });

  return sendJson(response, 200, {
    success: true,
    data: {
      id: trackingEvent.id,
      meta,
    },
  });
};

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method || "")) {
    return methodNotAllowed(response, ["GET", "POST"]);
  }

  const user = await requireDashboardAuth(request, response);

  if (!user) {
    return;
  }

  noStore(response);

  try {
    const resource = getFirstQueryValue(request.query?.resource);

    if (resource === "sales-agents") {
      return request.method === "GET"
        ? handleGetSalesAgents(request, response)
        : handleSaveSalesAgents(request, response, user);
    }

    if (resource === "queue-control") {
      if (request.method !== "POST") {
        return methodNotAllowed(response, ["POST"]);
      }

      return handleQueueControl(request, response, user);
    }

    if (resource === "lead-note") {
      if (!["POST", "PATCH", "DELETE"].includes(request.method || "")) {
        return methodNotAllowed(response, ["POST", "PATCH", "DELETE"]);
      }

      return handleLeadNote(request, response, user);
    }

    if (resource === "lead-call") {
      if (request.method !== "POST") {
        return methodNotAllowed(response, ["POST"]);
      }

      return handleLeadCall(request, response);
    }

    if (resource === "track") {
      if (request.method !== "POST") {
        return methodNotAllowed(response, ["POST"]);
      }

      return handleTrack(request, response);
    }

    if (request.method !== "GET") {
      return methodNotAllowed(response, ["GET"]);
    }

    const data = await buildDashboardSnapshot({
      dateFrom: getFirstQueryValue(request.query?.dateFrom),
      dateTo: getFirstQueryValue(request.query?.dateTo),
    });

    return sendJson(response, 200, {
      success: true,
      data,
    });
  } catch (error) {
    return sendJson(response, 500, {
      success: false,
      error: error instanceof Error ? error.message : "No pudimos cargar el dashboard.",
    });
  }
}

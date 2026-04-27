import {
  getDashboardAuthAdminClient,
  getDashboardUserContext,
  getDashboardUserRole,
  canAccessLead,
  requireDashboardAdmin,
  requireDashboardAuth,
  sendForbiddenLead,
} from "../_cirugia360-dashboard-auth.js";
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
import { getSpeedAdminClient, getSpeedLeadById } from "../_cirugia360-speed-db.js";
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

const assertLeadAccessByNoteId = async (noteId, user, response) => {
  const client = getSpeedAdminClient();
  const { data: note, error } = await client
    .from("c360_speed_lead_notes")
    .select("lead_id")
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "No pudimos cargar la nota.");
  }

  if (!note) {
    sendJson(response, 404, {
      success: false,
      error: "No encontramos esa nota.",
    });
    return false;
  }

  const lead = await getSpeedLeadById(note.lead_id);

  if (!lead) {
    sendJson(response, 404, {
      success: false,
      error: "No encontramos ese lead.",
    });
    return false;
  }

  if (!canAccessLead(user, lead)) {
    sendForbiddenLead(response);
    return false;
  }

  return true;
};

const handleGetSalesAgents = async (request, response, user) => {
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

  const userContext = getDashboardUserContext(user);
  const settingsPayload = buildSettingsFromConfig(mergedConfig);
  const publicSettings =
    userContext.role === "admin"
      ? settingsPayload
      : {
          ...settingsPayload,
          agents: settingsPayload.agents.filter(
            (agent) => agent.email?.toLowerCase() === userContext.email,
          ),
        };

  return sendJson(response, 200, {
    success: true,
    data: publicSettings,
  });
};

const handleSaveSalesAgents = async (request, response, user) => {
  const adminContext = requireDashboardAdmin(user, response);

  if (!adminContext) {
    return;
  }

  const baseConfig = getCirugia360SpeedConfig(request, {
    requireAgents: false,
    requireTwilio: false,
  });
  const body = await readJsonBody(request);
  const previousSettings = await loadSpeedRuntimeSettings(baseConfig.defaultCountryDialCode).catch(
    () => buildSettingsFromConfig(baseConfig),
  );
  const settingsWithAccounts = await syncSalesAgentAccounts(body, previousSettings);
  const settings = await saveSpeedRuntimeSettings({
    settings: settingsWithAccounts,
    defaultCountryDialCode: baseConfig.defaultCountryDialCode,
    updatedBy: user.email,
  });

  return sendJson(response, 200, {
    success: true,
    data: settings,
  });
};

const handleQueueControl = async (request, response, user) => {
  const adminContext = requireDashboardAdmin(user, response);

  if (!adminContext) {
    return;
  }

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

const listDashboardUsersByEmail = async (authAdmin) => {
  const usersByEmail = new Map();
  let page = 1;

  while (page < 20) {
    const { data, error } = await authAdmin.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      throw new Error(error.message || "No pudimos cargar las cuentas del equipo.");
    }

    for (const user of data?.users || []) {
      const email = normalizeText(user.email).toLowerCase();

      if (email) {
        usersByEmail.set(email, user);
      }
    }

    if (!data?.users?.length || data.users.length < 100) {
      break;
    }

    page += 1;
  }

  return usersByEmail;
};

const syncSalesAgentAccounts = async (settings, previousSettings = {}) => {
  const agents = Array.isArray(settings?.agents) ? settings.agents : [];
  const agentsWithEmail = agents.filter((agent) => normalizeText(agent?.email));
  const authAdmin = getDashboardAuthAdminClient();
  const usersByEmail = await listDashboardUsersByEmail(authAdmin);
  const nextAgentEmails = new Set(agentsWithEmail.map((agent) => normalizeText(agent.email).toLowerCase()));
  const removedAgents = (previousSettings?.agents || []).filter((agent) => {
    const email = normalizeText(agent?.email).toLowerCase();

    return email && !nextAgentEmails.has(email);
  });
  const syncedAgents = [];

  for (const removedAgent of removedAgents) {
    const email = normalizeText(removedAgent.email).toLowerCase();
    const existingUser = usersByEmail.get(email);

    if (!existingUser || getDashboardUserRole(existingUser) === "admin") {
      continue;
    }

    const { error } = await authAdmin.auth.admin.deleteUser(existingUser.id);

    if (error) {
      throw new Error(error.message || `No pudimos eliminar la cuenta de ${email}.`);
    }

    usersByEmail.delete(email);
  }

  for (const agent of agents) {
    const email = normalizeText(agent?.email).toLowerCase();
    const password = normalizeText(agent?.password);
    const accountActive = agent?.accountActive !== false;

    if (!email) {
      syncedAgents.push(agent);
      continue;
    }

    const existingUser = usersByEmail.get(email);
    let authUserId = existingUser?.id || null;

    if (existingUser) {
      const { data, error } = await authAdmin.auth.admin.updateUserById(existingUser.id, {
        password: password || undefined,
        ban_duration: accountActive ? "none" : "876000h",
        user_metadata: {
          ...(existingUser.user_metadata || {}),
          name: normalizeText(agent?.name),
          c360_role: "agent",
        },
        app_metadata: {
          ...(existingUser.app_metadata || {}),
          c360_role: "agent",
        },
      });

      if (error) {
        throw new Error(error.message || `No pudimos actualizar la cuenta de ${email}.`);
      }

      authUserId = data?.user?.id || existingUser.id;
    } else {
      if (!password) {
        throw new Error(`Ingresa una contrasena inicial para crear la cuenta de ${email}.`);
      }

      const { data, error } = await authAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        ban_duration: accountActive ? "none" : "876000h",
        user_metadata: {
          name: normalizeText(agent?.name),
          c360_role: "agent",
        },
        app_metadata: {
          c360_role: "agent",
        },
      });

      if (error) {
        throw new Error(error.message || `No pudimos crear la cuenta de ${email}.`);
      }

      authUserId = data?.user?.id || null;
    }

    const { password: _password, ...agentWithoutPassword } = agent;
    syncedAgents.push({
      ...agentWithoutPassword,
      email,
      accountActive,
      authUserId,
    });
  }

  return {
    ...settings,
    agents: syncedAgents,
  };
};

const handleLeadNote = async (request, response, user) => {
  const body = await readJsonBody(request);
  const noteId = Number(body.noteId || 0);
  const leadId = normalizeText(body.leadId);
  const noteBody = normalizeText(body.body);
  const action = normalizeText(body.action).toLowerCase();

  if (request.method === "PATCH") {
    if (noteId && !(await assertLeadAccessByNoteId(noteId, user, response))) {
      return;
    }

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

    if (!(await assertLeadAccessByNoteId(noteId, user, response))) {
      return;
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

  const lead = await getSpeedLeadById(leadId);

  if (!lead) {
    return sendJson(response, 404, {
      success: false,
      error: "No encontramos ese lead.",
    });
  }

  if (!canAccessLead(user, lead)) {
    return sendForbiddenLead(response);
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

const handleLeadCall = async (request, response, user) => {
  const body = await readJsonBody(request);
  const leadId = normalizeText(body.leadId);

  if (!leadId) {
    return sendJson(response, 400, {
      success: false,
      error: "Selecciona un lead para llamar.",
    });
  }

  const lead = await getSpeedLeadById(leadId);

  if (!lead) {
    return sendJson(response, 404, {
      success: false,
      error: "No encontramos ese lead.",
    });
  }

  if (!canAccessLead(user, lead)) {
    return sendForbiddenLead(response);
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
  if (!["GET", "POST", "PATCH", "DELETE"].includes(request.method || "")) {
    return methodNotAllowed(response, ["GET", "POST", "PATCH", "DELETE"]);
  }

  const user = await requireDashboardAuth(request, response);

  if (!user) {
    return;
  }

  noStore(response);

  try {
    const resource = getFirstQueryValue(request.query?.resource);

    if (resource === "sales-agents") {
      if (!["GET", "POST"].includes(request.method || "")) {
        return methodNotAllowed(response, ["GET", "POST"]);
      }

      return request.method === "GET"
        ? handleGetSalesAgents(request, response, user)
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

      return handleLeadCall(request, response, user);
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
      viewer: getDashboardUserContext(user),
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

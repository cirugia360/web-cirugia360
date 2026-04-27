import { getSpeedAdminClient } from "./_cirugia360-speed-db.js";
import { normalizeEmail, normalizePhoneInput, normalizeText, uniqueStrings } from "./_cirugia360-speed-shared.js";

const SETTINGS_TABLE = "c360_speed_settings";
const SETTINGS_KEY = "runtime";
const ACTIVITY_TABLE = "c360_speed_agent_activity";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeAgent = (agent, index, defaultCountryDialCode) => {
  const name = normalizeText(agent?.name);
  const phone = normalizePhoneInput(agent?.phone, defaultCountryDialCode);
  const email = normalizeEmail(agent?.email);
  const id = normalizeText(agent?.id) || `agent-${index + 1}`;

  if (!name || !phone) {
    return null;
  }

  return {
    id,
    name,
    phone,
    email,
    active: agent?.active !== false,
    accountActive: agent?.accountActive !== false,
    authUserId: normalizeText(agent?.authUserId) || null,
    lastAutoDeactivation: isPlainObject(agent?.lastAutoDeactivation)
      ? {
          at: normalizeText(agent.lastAutoDeactivation.at) || null,
          reason: normalizeText(agent.lastAutoDeactivation.reason) || null,
          leadId: normalizeText(agent.lastAutoDeactivation.leadId) || null,
          leadName: normalizeText(agent.lastAutoDeactivation.leadName) || null,
        }
      : null,
  };
};

export const normalizeSalesAgentSettings = (value = {}, defaultCountryDialCode = "56") => {
  const source = isPlainObject(value) ? value : {};
  const agents = Array.isArray(source.agents)
    ? source.agents
        .map((agent, index) => normalizeAgent(agent, index, defaultCountryDialCode))
        .filter(Boolean)
    : [];
  const uniqueAgentIds = new Set();
  const normalizedAgents = agents.map((agent, index) => {
    let id = agent.id;

    if (uniqueAgentIds.has(id)) {
      id = `${id}-${index + 1}`;
    }

    uniqueAgentIds.add(id);
    return {
      ...agent,
      id,
    };
  });

  return {
    businessTimeZone: normalizeText(source.businessTimeZone) || "America/Santiago",
    queuePaused: source.queuePaused === true,
    agents: normalizedAgents,
  };
};

export const loadSpeedRuntimeSettings = async (defaultCountryDialCode = "56") => {
  const client = getSpeedAdminClient();
  const { data, error } = await client
    .from(SETTINGS_TABLE)
    .select("value, updated_at, updated_by")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "No se pudo cargar la configuracion del dashboard.");
  }

  return {
    ...normalizeSalesAgentSettings(data?.value || {}, defaultCountryDialCode),
    updatedAt: data?.updated_at || null,
    updatedBy: data?.updated_by || null,
  };
};

export const saveSpeedRuntimeSettings = async ({
  settings,
  defaultCountryDialCode = "56",
  updatedBy = null,
}) => {
  const client = getSpeedAdminClient();
  const normalizedSettings = normalizeSalesAgentSettings(settings, defaultCountryDialCode);
  const { data, error } = await client
    .from(SETTINGS_TABLE)
    .upsert(
      {
        key: SETTINGS_KEY,
        value: normalizedSettings,
        updated_at: new Date().toISOString(),
        updated_by: normalizeText(updatedBy) || null,
      },
      {
        onConflict: "key",
      },
    )
    .select("value, updated_at, updated_by")
    .single();

  if (error) {
    throw new Error(error.message || "No se pudo guardar la configuracion del dashboard.");
  }

  return {
    ...normalizeSalesAgentSettings(data?.value || {}, defaultCountryDialCode),
    updatedAt: data?.updated_at || null,
    updatedBy: data?.updated_by || null,
  };
};

export const mergeRuntimeSettingsIntoConfig = async (config, options = {}) => {
  const requireAgents = options.requireAgents !== false;
  let settings = null;

  try {
    settings = await loadSpeedRuntimeSettings(config.defaultCountryDialCode);
  } catch (error) {
    if (requireAgents && !config.salesAgents.length) {
      throw error;
    }
  }

  // Keep ALL agents (active and inactive) in the merged list. Inactive agents
  // carry `active: false` so the workflow can recognise them without losing
  // the historical assignment on each lead.
  const settingsAgents = (settings?.agents || []).map(({ id, name, phone, email, active, accountActive, authUserId, lastAutoDeactivation }) => ({
    id,
    name,
    phone,
    email,
    active: active !== false,
    accountActive: accountActive !== false,
    authUserId: authUserId || null,
    lastAutoDeactivation: lastAutoDeactivation || null,
  }));
  const mergedAgents = settingsAgents.length
    ? settingsAgents
    : config.salesAgents.map((agent) => ({ ...agent, active: agent.active !== false }));
  const activeMergedAgents = mergedAgents.filter((agent) => agent.active !== false);

  if (requireAgents && activeMergedAgents.length === 0) {
    throw new Error(
      "Define al menos una asesora activa en el dashboard o en CIRUGIA360_STL_AGENTS_JSON antes de iniciar llamadas.",
    );
  }

  return {
    ...config,
    businessTimeZone: settings?.businessTimeZone || config.businessTimeZone,
    queuePaused: settings?.queuePaused ?? config.queuePaused,
    salesAgents: mergedAgents,
    dashboardSettings: settings,
  };
};

export const buildSettingsFromConfig = (config) => ({
  businessTimeZone: config.dashboardSettings?.businessTimeZone || config.businessTimeZone,
  queuePaused: config.dashboardSettings?.queuePaused ?? config.queuePaused,
  agents:
    config.dashboardSettings?.agents?.length
      ? config.dashboardSettings.agents
      : config.salesAgents.map((agent) => ({ ...agent, active: true })),
});

export const getAgentIds = (settings) => uniqueStrings((settings?.agents || []).map((agent) => agent.id));

export const insertAgentActivityChange = async ({
  agent,
  active,
  reason = null,
  lead = null,
  changedBy = null,
}) => {
  const email = normalizeEmail(agent?.email);

  if (!email) {
    return null;
  }

  const client = getSpeedAdminClient();
  const { data, error } = await client
    .from(ACTIVITY_TABLE)
    .insert({
      agent_id: normalizeText(agent?.id) || null,
      agent_email: email,
      agent_name: normalizeText(agent?.name) || null,
      active: active === true,
      reason: normalizeText(reason) || null,
      lead_id: normalizeText(lead?.id) || null,
      lead_name: normalizeText(lead?.full_name) || null,
      changed_by: normalizeText(changedBy) || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "No se pudo registrar el cambio de actividad.");
  }

  return data;
};

export const logAgentActivityChanges = async ({
  previousAgents = [],
  nextAgents = [],
  changedBy = null,
}) => {
  const previousByEmail = new Map(
    (previousAgents || [])
      .map((agent) => [normalizeEmail(agent?.email), agent])
      .filter(([email]) => Boolean(email)),
  );

  for (const nextAgent of nextAgents || []) {
    const email = normalizeEmail(nextAgent?.email);

    if (!email) {
      continue;
    }

    const previousAgent = previousByEmail.get(email);

    if (!previousAgent) {
      if (nextAgent.active !== false) {
        await insertAgentActivityChange({
          agent: nextAgent,
          active: true,
          reason: "Vendedora creada en Equipo.",
          changedBy,
        });
      }

      continue;
    }

    if (previousAgent.active === nextAgent.active) {
      continue;
    }

    await insertAgentActivityChange({
      agent: nextAgent,
      active: nextAgent.active !== false,
      reason: "Cambio manual desde Equipo.",
      changedBy,
    });
  }
};

export const updateRuntimeAgentStatus = async ({
  agentEmail = "",
  agentId = "",
  active,
  reason = null,
  lead = null,
  defaultCountryDialCode = "56",
  updatedBy = null,
}) => {
  const settings = await loadSpeedRuntimeSettings(defaultCountryDialCode);
  const normalizedEmail = normalizeEmail(agentEmail);
  const normalizedAgentId = normalizeText(agentId);
  let matchedAgent = null;
  const nextSettings = {
    ...settings,
    agents: settings.agents.map((agent) => {
      const matches =
        (normalizedAgentId && agent.id === normalizedAgentId) ||
        (normalizedEmail && agent.email === normalizedEmail);

      if (!matches) {
        return agent;
      }

      matchedAgent = agent;
      return {
        ...agent,
        active: active === true,
        lastAutoDeactivation:
          active === false && reason
            ? {
                at: new Date().toISOString(),
                reason: normalizeText(reason),
                leadId: normalizeText(lead?.id) || null,
                leadName: normalizeText(lead?.full_name) || null,
              }
            : agent.lastAutoDeactivation || null,
      };
    }),
  };

  if (!matchedAgent) {
    return {
      settings,
      agent: null,
    };
  }

  const savedSettings = await saveSpeedRuntimeSettings({
    settings: nextSettings,
    defaultCountryDialCode,
    updatedBy,
  });
  const savedAgent = savedSettings.agents.find((agent) => agent.id === matchedAgent.id) || null;

  if (matchedAgent.active !== active && savedAgent) {
    await insertAgentActivityChange({
      agent: savedAgent,
      active: active === true,
      reason,
      lead,
      changedBy: updatedBy,
    });
  }

  return {
    settings: savedSettings,
    agent: savedAgent,
  };
};

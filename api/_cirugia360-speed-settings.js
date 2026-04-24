import { getSpeedAdminClient } from "./_cirugia360-speed-db.js";
import { normalizePhoneInput, normalizeText, uniqueStrings } from "./_cirugia360-speed-shared.js";

const SETTINGS_TABLE = "c360_speed_settings";
const SETTINGS_KEY = "runtime";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeAgent = (agent, index, defaultCountryDialCode) => {
  const name = normalizeText(agent?.name);
  const phone = normalizePhoneInput(agent?.phone, defaultCountryDialCode);
  const id = normalizeText(agent?.id) || `agent-${index + 1}`;

  if (!name || !phone) {
    return null;
  }

  return {
    id,
    name,
    phone,
    active: agent?.active !== false,
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

  const activeSettingsAgents = (settings?.agents || []).filter((agent) => agent.active);
  const mergedAgents = activeSettingsAgents.length
    ? activeSettingsAgents.map(({ id, name, phone }) => ({ id, name, phone }))
    : config.salesAgents;

  if (requireAgents && !mergedAgents.length) {
    throw new Error(
      "Define asesoras en el dashboard o en CIRUGIA360_STL_AGENTS_JSON antes de iniciar llamadas.",
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
